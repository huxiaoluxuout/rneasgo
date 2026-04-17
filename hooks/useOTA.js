// 蓝牙OTA升级类
class BluetoothOTAUpdater {
    iosTimeout = 10

    constructor() {
        this.deviceId = null; // 蓝牙设备ID
        this.serviceId = null; // 服务UUID
        this.writeCharId = null; // 写入特征UUID


        this.fileStartAddress = 0; // 文件起始地址
        this.totalChecksum = 0; // 总校验和
        this.retryCount = 0; // 重试次数

        this.byte_16List = []; //

        this.index = 0 // 整个文件的索引
        this.lastIndex = -1

        this.lastIndexNum = 0
        /*----------------------------------------------*/
        /*----------------------------------------------*/
        this.sendingQueue = []; // 待发送队列
        this.isSending = false; // 发送状态标志
        this.lock = false; // 原子操作锁
        this.currentIndex = 0; // 当前发送索引
        this.lastConfirmedIndex = -1; // 最后确认的索引

        /*----------------------------------------------*/
        /*----------------------------------------------*/


    }

// 原子操作 - 获取下一个发送索引
    getNextIndex() {
        while (this.lock) {
            // 等待锁释放
        }
        this.lock = true;
        const nextIndex = this.currentIndex++;
        this.lock = false;
        return nextIndex;
    }

    /**
     * 初始化蓝牙OTA升级
     * @param {Object} deviceInfo 蓝牙设备信息
     * @param {string} fileData 升级文件数据
     * @param {function} callback 升级文件数据
     */
    startOTA(deviceInfo, fileData, callback) {
        this.deviceId = deviceInfo.deviceId;
        this.serviceId = deviceInfo.serviceId;
        this.writeCharId = deviceInfo.writeCharId;
        this.parseIntelHex(fileData, callback)
        // 整个文件的索引
        this.index = 0
        this.lastIndexNum = 0

        this.lastIndex = -1


        /*----------------------------------------------*/
        /*----------------------------------------------*/
        this.sendingQueue = []; // 待发送队列
        this.isSending = false; // 发送状态标志
        this.lock = false; // 原子操作锁
        this.currentIndex = 0; // 当前发送索引
        this.lastConfirmedIndex = -1; // 最后确认的索引
        /*----------------------------------------------*/
        /*----------------------------------------------*/
    }

    /**
     * @param {string} hexText 升级文件数据
     * @param {function} callback
     */
    parseIntelHex(hexText, callback) {
        const lines = hexText.split('\n');
        const MAX_SIZE = 1024 * 1024; // 1MB预分配
        const data = new Uint8Array(MAX_SIZE);
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
                bytes[j] = parseInt(line.substr(i, 2), 16);
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

    calculateAndGenerate(data) {
        let sum = 0;
        const chunkCount = Math.ceil(data.length / 16);
        const bty16 = new Array(chunkCount);
        const buffer = new ArrayBuffer(chunkCount * 16);

        for (let i = 0; i < chunkCount; i++) {
            const start = i * 16;
            const end = Math.min(start + 16, data.length);
            const chunk = new Uint8Array(buffer, i * 16, 16);

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

    /**
     * 初始化蓝牙OTA升级文件
     * @param {string} fileData 升级文件数据
     * @param {function} callback 升级文件数据
     */
    initHexText(fileData, callback) {
        this.parseIntelHex(fileData, callback)
    }

    errNum = 0

    // 预计算常量
    HEADER_SUM = 0x5A + 0x13;

    // 构建发送数据
    buildPacket(index) {
        const packet = new Uint8Array(20);
        packet[0] = 0x5A;                  // 起始符
        packet[1] = 0x13;                  // 包长度

        // 1. 流水号计算
        const seq = index & 0x3F;
        packet[2] = seq;

        // 2. 数据拷贝
        const data = this.byte_16List[index];
        packet.set(data, 3);

        // 3. 校验和计算
        let checksum = this.HEADER_SUM + seq;

        // 使用位运算优化累加
        for (let j = 0; j < 16; j += 4) {
            // 一次处理4个字节（32位CPU处理更高效）
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
        const packet = new Uint8Array(9); // 正确：9字节
        packet[0] = 0x5A;  // 起始符
        packet[1] = 0x08;  // 长度（后续7字节：命令1+地址4+校验2）
        packet[2] = 0xFC;  // 命令码
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

    /**
     * 统一数据包发送方法（支持正常发送和重发上一个包）
     * @param {function} [callback]
     * @param {function} [errCallBack]
     * @param {boolean} [isLastPacket]
     */
    // 发送数据包 - 改进版本
    async sendDataPackets(callback, errCallBack, isLastPacket = false) {
        // 原子获取当前索引
        const indexResult = this.getNextIndex();
        const index = isLastPacket ? indexResult - 1 : indexResult;
        const totalPackets = this.byte_16List.length;

        // 已完成所有包发送
        if (index >= totalPackets) {
            callback && callback('00');
            console.log('升级完成', this.deviceId)
            return;
        }

        // 构建并发送当前数据包
        const packet = this.buildPacket(index);

        /*console.warn('--发送--', index, totalPackets,
            this.ab2hex(packet).toLocaleUpperCase().match(/.{1,2}/g).join(' '));*/

        // 到达最后允许发送的包序号
        if (index === this.lastIndex) {
            console.error('lastIndex', this.lastIndex);
            return;
        }

        try {
            // 通过蓝牙发送
            await this.writeBLE(packet, 1);
            this.lastConfirmedIndex = index; // 更新最后确认索引
            callback && callback(); // 执行成功回调
        } catch (error) {
            // 发送失败时回退索引
            this.currentIndex--;
            errCallBack && errCallBack(error);
        }
    }


    // 重发上一个数据包（保持原有方法名兼容性）
    sendLastDataPackets(callback, errCallBack) {
        this.sendDataPackets(callback, errCallBack, true);
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
        // 1. 计算结束包的校验和（不包括自身）
        const packetWithoutChecksum = [
            0x5A,               // 起始符
            0x06,              // 包长度（6字节）
            0xFB,              // 命令码（结束包）
            this.totalChecksum[0],  // 总数据校验和高字节
            this.totalChecksum[1]    // 总数据校验和低字节

            // this.totalChecksum[1],
            // this.totalChecksum[2]
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

// 修改后的发送方法
    async writeBLE(data, type) {

        return new Promise((resolve, reject) => {
            /*if (plus.os.name == "iOS") {
                if (type === 1) {
                    setTimeout(resolve, this.iosTimeout)
                }
            }
            uni.writeBLECharacteristicValue({
                deviceId: this.deviceId,
                serviceId: this.serviceId,
                characteristicId: this.writeCharId,
                value: data.buffer,
                success: resolve,
                fail: reject
            });*/
        });

    }

    // 2进制转成16进制
    ab2hex(buffer) {
        return Array.from(new Uint8Array(buffer), bit => ('00' + bit.toString(16)).slice(-2)).join('');
    }

}

export const ylxBleOTA = new BluetoothOTAUpdater()
