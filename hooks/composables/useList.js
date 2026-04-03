// composables/useList.js
import { ref, computed } from 'vue'

// ==================== 工具函数 ====================
// 防抖
function debounce(fn, delay = 300, immediate = false) {
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

// 节流
function throttle(fn, delay = 300, options = { leading: true, trailing: true }) {
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

// 请求去重
function dedupeRequest(fn) {
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

// ==================== 主函数 ====================
export function useList(options = {}) {
    const {
        fetchListApi,        // API函数
        immediate = true,    // 立即加载
        pageSize = 10,       // 每页数量
        params = {},         // 请求参数
        debounceDelay = 300, // 防抖延迟（搜索用），0=禁用
        throttleDelay = 500, // 节流延迟（触底用），0=禁用
        enableDedupe = true  // 请求去重
    } = options

    // ==================== 数据状态 ====================
    const list = ref([])
    const loading = ref(false)      // 加载中（刷新/首次）
    const loadMore = ref(false)     // 加载更多中
    const finished = ref(false)     // 已全部加载
    const empty = ref(false)        // 空数据
    const error = ref(null)         // 错误信息

    // 白屏解决相关状态
    const firstLoading = ref(true)   // 首次加载中
    const hasLoadedOnce = ref(false) // 已加载过至少一次

    // 分页
    const page = ref(1)

    // 请求锁
    let isFetching = false

    // ==================== 计算属性 ====================
    const showEmpty = computed(() => empty.value && !loading.value && !firstLoading.value)
    const showFinished = computed(() => finished.value && list.value.length > 0)
    const showLoadMore = computed(() => loadMore.value)
    const showSkeleton = computed(() => firstLoading.value && !hasLoadedOnce.value)
    const showContent = computed(() => !firstLoading.value && !error.value)

    // ==================== 核心方法 ====================
    const reset = () => {
        page.value = 1
        list.value = []
        finished.value = false
        empty.value = false
        error.value = null
    }

    // 核心请求方法
    const fetchListCore = async (isRefresh = false) => {
        if (isFetching) return

        try {
            isFetching = true

            if (isRefresh) {
                reset()
                if (!hasLoadedOnce.value) {
                    firstLoading.value = true
                }
                loading.value = true
            } else {
                if (finished.value || loading.value) return
                loadMore.value = true
            }

            // 支持动态参数
            const requestParams = {
                page: page.value,
                pageSize,
                ...(typeof params === 'function' ? params() : params)
            }

            const res = await fetchListApi(requestParams)
            const newList = res.data?.list || res.data || []
            const total = res.data?.total || 0

            if (isRefresh) {
                list.value = newList
            } else {
                list.value = [...list.value, ...newList]
            }

            const hasMore = list.value.length < total
            finished.value = !hasMore
            empty.value = list.value.length === 0

            if (hasMore && newList.length > 0) {
                page.value++
            }

            error.value = null
            hasLoadedOnce.value = true
            firstLoading.value = false

        } catch (err) {
            error.value = err.message || '加载失败'
            firstLoading.value = false
        } finally {
            loading.value = false
            loadMore.value = false
            isFetching = false
        }
    }

    // 应用请求去重
    const fetchList = enableDedupe ? dedupeRequest(fetchListCore) : fetchListCore

    // ==================== 带节流的下拉刷新 ====================
    const onRefresh = (throttleDelay > 0
            ? throttle(async () => {
                await fetchList(true)
                uni.stopPullDownRefresh()
            }, throttleDelay, { leading: true, trailing: false })
            : async () => {
                await fetchList(true)
                uni.stopPullDownRefresh()
            }
    )

    // ==================== 带节流的触底加载 ====================
    const onLoadMore = (throttleDelay > 0
            ? throttle(() => {
                if (!finished.value && !loading.value && !loadMore.value) {
                    fetchList(false)
                }
            }, throttleDelay, { leading: true, trailing: false })
            : () => {
                if (!finished.value && !loading.value && !loadMore.value) {
                    fetchList(false)
                }
            }
    )

    // ==================== 带防抖的搜索 ====================
    let debouncedSearchFn = null

    const setupDebouncedSearch = () => {
        if (debounceDelay > 0) {
            debouncedSearchFn = debounce(async (searchParams) => {
                if (typeof params === 'object') {
                    Object.assign(params, searchParams)
                }
                await fetchList(true)
            }, debounceDelay)
        }
    }

    const onSearch = (searchParams) => {
        if (debouncedSearchFn) {
            debouncedSearchFn(searchParams)
        } else {
            if (typeof params === 'object') {
                Object.assign(params, searchParams)
            }
            fetchList(true)
        }
    }

    // 手动重试
    const retry = () => {
        firstLoading.value = true
        return fetchList(true)
    }

    // 手动刷新
    const reload = () => {
        return fetchList(true)
    }

    // 初始化
    setupDebouncedSearch()
    if (immediate) {
        fetchList(true)
    }

    return {
        // 数据
        list,
        loading,
        loadMore,
        finished,
        empty,
        error,

        // 白屏控制
        firstLoading,
        hasLoadedOnce,
        showSkeleton,
        showContent,
        showEmpty,
        showFinished,
        showLoadMore,

        // 方法
        onRefresh,
        onLoadMore,
        onSearch,
        retry,
        reload,
        fetchList
    }
}
