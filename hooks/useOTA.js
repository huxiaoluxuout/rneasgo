// 蓝牙OTA升级类
class BluetoothOTAUpdater {
    static PACKET_HEADER = 0x5A;
    static CMD_HANDSHAKE = 0xFC;
    static CMD_FINISH = 0xFB;
    static DATA_PACKET_LENGTH = 0x13;
    static HANDSHAKE_PACKET_LENGTH = 0x08;
    static FINISH_PACKET_LENGTH = 0x06;
    static CHUNK_SIZE = 16;
    static MAX_FILE_SIZE = 1024 * 1024;

    constructor() {
        this.reset();
    }

    reset() {
        this.iosTimeout = 10;
        this.deviceId = null;
        this.serviceId = null;
        this.writeCharId = null;

        this.fileStartAddress = 0;
        this.totalChecksum = 0;

        this.byte_16List = [];

        this.index = 0;
        this.lastIndexNum = 0;

        this.sendingQueue = [];
        this.isSending = false;
        this.currentIndex = 0;
        this.lastConfirmedIndex = -1; // 上一个已确认的索引


        this.errNum = 0;
    }

    /**
     * 初始化蓝牙OTA升级
     * @param {Object} deviceInfo 蓝牙设备信息
     * @param {string} fileData 升级文件数据
     * @param {function} callback 
     */
    startOTA(deviceInfo, fileData, callback) {
        this.reset();

        this.deviceId = deviceInfo.deviceId;
        this.serviceId = deviceInfo.serviceId;
        this.writeCharId = deviceInfo.writeCharId;

        this.parseIntelHex(fileData, callback);
    }

    /** 解析Intel Hex文件
     * @param {string} hexText 升级文件数据
     * @param {function} callback
     */
    parseIntelHex(hexText, callback) {
        const lines = hexText.split('\n');
        const data = new Uint8Array(BluetoothOTAUpdater.MAX_FILE_SIZE);
        let dataLength = 0;
        let currentUpperAddress = 0;
        let startAddress = null;
        let lineCount = 0;

        // 预解析所有行
        for (const line of lines) {
            if (!line.startsWith(':')) continue;
            lineCount++;

            // 快速解析行
            const bytes = new Uint8Array((line.length - 1) / 2);
            for (let i = 1, j = 0; i < line.length; i += 2, j++) {
                bytes[j] = parseInt(line.slice(i, i + 2), 16);
            }

            const byteCount = bytes[0];
            const lowerAddress = (bytes[1] << 8) | bytes[2];
            const recordType = bytes[3];

            // 处理记录类型
            if (recordType === 0x04) {
                currentUpperAddress = ((bytes[4] << 8) | bytes[5]) << 16;
            } else if (recordType === 0x00) {
                const fullAddress = currentUpperAddress + lowerAddress;
                if (startAddress === null) {
                    startAddress = fullAddress;
                    dataLength = 0;
                }

                // 填充空缺
                const gap = fullAddress - startAddress - dataLength;
                if (gap > 0) {
                    data.fill(0x00, dataLength, dataLength + gap);
                    dataLength += gap;
                }

                // 复制数据
                data.set(bytes.subarray(4, 4 + byteCount), dataLength);
                dataLength += byteCount;
            }
        }

        // 裁剪到实际大小
        // this.targetData = data.slice(0, dataLength);
        this.fileStartAddress = startAddress || 0;

        // 并行计算校验和和生成数据包
        const [totalChecksum, bty16] = this.calculateAndGenerate(data.slice(0, dataLength));
        this.totalChecksum = totalChecksum;
        this.byte_16List = bty16;

        let totalChecksumYHex = totalChecksum[0].toString(16) + ' ' + totalChecksum[1].toString(16)
        console.log('总校验码', totalChecksumYHex)
        callback({
            totalChecksum: this.totalChecksum,
            startAddress: this.fileStartAddress,
            totalBty16Packets: bty16.length
        });
    }

    // 原子操作 - 获取下一个发送索引
    getNextIndex() {
        return this.currentIndex++;
    }

    calculateAndGenerate(data) {
        let sum = 0;
        const chunkCount = Math.ceil(data.length / BluetoothOTAUpdater.CHUNK_SIZE);
        const bty16 = new Array(chunkCount);
        const buffer = new ArrayBuffer(chunkCount * BluetoothOTAUpdater.CHUNK_SIZE);

        for (let i = 0; i < chunkCount; i++) {
            const start = i * BluetoothOTAUpdater.CHUNK_SIZE;
            const end = Math.min(start + BluetoothOTAUpdater.CHUNK_SIZE, data.length);
            const chunk = new Uint8Array(buffer, i * BluetoothOTAUpdater.CHUNK_SIZE, BluetoothOTAUpdater.CHUNK_SIZE);

            // 填充并计算校验和
            chunk.fill(0x00);
            chunk.set(data.subarray(start, end));

            // 计算这部分数据的校验和
            for (let j = 0; j < end - start; j++) {
                sum += data[start + j];
                sum &= 0xFFFF; // 防止溢出
            }

            bty16[i] = chunk;
        }


        return [
            [(sum >> 8) & 0xFF, sum & 0xFF],
            bty16
        ];
    }

    // 构建发送数据
    buildPacket(index) {
        const packet = new Uint8Array(20);
        packet[0] = BluetoothOTAUpdater.PACKET_HEADER;
        packet[1] = BluetoothOTAUpdater.DATA_PACKET_LENGTH;

        const seq = index & 0x3F;
        packet[2] = seq;

        const data = this.byte_16List[index];
        packet.set(data, 3);

        let checksum = BluetoothOTAUpdater.PACKET_HEADER + BluetoothOTAUpdater.DATA_PACKET_LENGTH + seq;

        for (let j = 0; j < BluetoothOTAUpdater.CHUNK_SIZE; j += 4) {
            checksum += data[j] + data[j + 1] + data[j + 2] + data[j + 3];
        }

        packet[19] = checksum & 0xFF;

        return packet;
    }

    /**
     * 发送握手包
     * 握手包结构（共9字节）：
     * [0]: 0x5A
     * [1]: 长度0x08（后续8字节：长度1+命令1+地址4+校验2）
     * [2]: 命令0xFC
     * [3-6]: 地址(4字节大端)
     * [7-8]: 校验和(2字节)
     */
    sendHandshake() {
        const packet = new Uint8Array(9);
        packet[0] = BluetoothOTAUpdater.PACKET_HEADER;
        packet[1] = BluetoothOTAUpdater.HANDSHAKE_PACKET_LENGTH;
        packet[2] = BluetoothOTAUpdater.CMD_HANDSHAKE;
        // 地址（大端模式）

        console.log('文件起始地址', this.fileStartAddress)
        packet[3] = (this.fileStartAddress >> 24) & 0xFF;
        packet[4] = (this.fileStartAddress >> 16) & 0xFF;
        packet[5] = (this.fileStartAddress >> 8) & 0xFF;
        packet[6] = this.fileStartAddress & 0xFF;
        // 校验和（计算前7字节）
        const checksum = this.calculateChecksum(packet.subarray(0, 7));
        packet[7] = (checksum >> 8) & 0xFF; // 高位
        packet[8] = checksum & 0xFF;        // 低位
        this.writeBLE(packet).then(() => {
            console.log('发送握手包成功', this.deviceId)
        }).catch(err => {
            console.error('发送握手包', this.deviceId, err,)
            this.errNum++
            if (this.errNum <= 3) {
                setTimeout(() => {
                    this.sendHandshake()
                }, 100)
            }
        })
    }

    /** 发送数据包
     * @param {function} [callback] 成功回调 callback(index, isLastPacket)
     * @param {function} [errCallBack] 错误回调
     * @returns {Promise<boolean>} true=还有更多包, false=全部发送完成
     */
    async sendDataPackets(callback, errCallBack) {
        const index = this.currentIndex;
        const totalPackets = this.byte_16List.length;

        if (index >= totalPackets) {
            console.log('升级完成，已发送所有数据包', this.deviceId);
            callback && callback(index, true);
            return false;
        }

        const isLastPacket = (index === totalPackets - 1);
        const packet = this.buildPacket(index);

        try {
            this.currentIndex++;
            await this.writeBLE(packet, 1);
            this.lastConfirmedIndex = index;
            callback && callback(index, isLastPacket);
            return !isLastPacket;
        } catch (error) {
            errCallBack && errCallBack(error);
            throw error;
        }
    }

    /**
     * 检查是否还有未发送的数据包
     * @returns {boolean} true=还有剩余, false=已全部发送
     */
    hasMorePackets() {
        return this.currentIndex < this.byte_16List.length;
    }

    /**
     * 获取当前发送进度
     * @returns {{current: number, total: number, percent: number}}
     */
    getProgress() {
        const total = this.byte_16List.length;
        const current = Math.min(this.currentIndex, total);
        return {
            current,
            total,
            percent: total > 0 ? Math.round((current / total) * 100) : 0,
            isComplete: current >= total
        };
    }

    /**
     * 重发上一个数据包
     * 使用 lastConfirmedIndex 确保重发正确的包
     * @param {function} [callback] 成功回调
     * @param {function} [errCallBack] 错误回调
     */
    async sendPrevPackets(callback, errCallBack) {
        if (this.lastConfirmedIndex < 0) {
            const error = new Error('没有可重发的包：尚未成功发送任何数据包');
            console.error(error.message);
            errCallBack && errCallBack(error);
            return;
        }

        const index = this.lastConfirmedIndex;
        const totalPackets = this.byte_16List.length;

        if (index >= totalPackets) {
            const error = new Error(`重发索引越界: ${index} >= ${totalPackets}`);
            console.error(error.message);
            errCallBack && errCallBack(error);
            return;
        }

        const packet = this.buildPacket(index);

        try {
            await this.writeBLE(packet, 1);
            callback && callback();
        } catch (error) {
            errCallBack && errCallBack(error);
        }
    }

    /**
     * 发送结束包
     * 结束包结构（共7字节）：
     * [0]: 0x5A (起始符)
     * [1]: 0x06 (长度: 后续6字节)
     * [2]: 0xFB (命令码)
     * [3-4]: 文件总校验和
     * [5-6]: 包校验和（校验0x5A~[4]）
     */
    async sendFinish() {
        const packetWithoutChecksum = [
            BluetoothOTAUpdater.PACKET_HEADER,
            BluetoothOTAUpdater.FINISH_PACKET_LENGTH,
            BluetoothOTAUpdater.CMD_FINISH,
            this.totalChecksum[0],
            this.totalChecksum[1]
        ];

        // 2. 计算结束包的校验和
        let sum = 0;
        for (const byte of packetWithoutChecksum) {
            sum += byte;
        }
        sum = sum & 0xFFFF; // 取低16位

        // 3. 构造完整结束包（大端模式）
        const endPacket = new Uint8Array([
            ...packetWithoutChecksum,
            (sum >> 8) & 0xFF, // 校验和高字节
            sum & 0xFF         // 校验和低字节
        ]);


        console.warn(this.ab2hex(endPacket).toLocaleUpperCase().match(/.{1,2}/g).join(' '));

        // 发送结束包
        await this.writeBLE(endPacket);

        return true;
    }

    /**
     * 计算16位校验和(大端模式)
     */
    calculateChecksum(data) {
        let checksum = 0;

        for (let i = 0; i < data.length; i++) {
            checksum += data[i];
            checksum &= 0xFFFF; // 保持16位
        }

        return checksum;
    }


    setIOSTimeout(timeout = 10) {
        this.iosTimeout = timeout
    }


    // 2进制转成16进制
    ab2hex(buffer) {
        return Array.from(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2)).join('');
    }

     async writeBLE(data, type) {
        return new Promise((resolve, reject) => {
            reject(new Error('writeBLE 未实现：需要集成 BLE 服务'));
        });
    }

}

export const ylxBleOTA = new BluetoothOTAUpdater()
