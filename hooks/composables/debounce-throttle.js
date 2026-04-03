/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @param {Boolean} immediate 是否立即执行
 * @returns {Function}
 */
export function debounce(fn, delay = 300, immediate = false) {
    let timer = null
    return function(...args) {
        if (timer) clearTimeout(timer)
        if (immediate && !timer) {
            fn.apply(this, args)
        }
        timer = setTimeout(() => {
            if (!immediate) {
                fn.apply(this, args)
            }
            timer = null
        }, delay)
    }
}

/**
 * 节流函数
 * @param {Function} fn 需要节流的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @param {Object} options 配置项
 * @param {Boolean} options.leading 是否首次立即执行
 * @param {Boolean} options.trailing 是否最后一次执行
 */
export function throttle(fn, delay = 300, options = { leading: true, trailing: true }) {
    let timer = null
    let lastTime = 0

    return function(...args) {
        const now = Date.now()

        if (!options.leading && lastTime === 0) {
            lastTime = now
        }

        const remaining = delay - (now - lastTime)

        if (remaining <= 0 || remaining > delay) {
            if (timer) {
                clearTimeout(timer)
                timer = null
            }
            lastTime = now
            fn.apply(this, args)
        } else if (!timer && options.trailing) {
            timer = setTimeout(() => {
                lastTime = options.leading ? Date.now() : 0
                fn.apply(this, args)
                timer = null
            }, remaining)
        }
    }
}

/**
 * 请求去重（防止短时间内重复请求）
 * @param {Function} fn 原始函数
 * @returns {Function}
 */
export function dedupeRequest(fn) {
    let pending = false
    return async function(...args) {
        if (pending) return
        pending = true
        try {
            return await fn.apply(this, args)
        } finally {
            pending = false
        }
    }
}
