<template>
  <view class="page">
    <!-- 搜索框（带防抖） -->
    <view class="search-box">
      <input
          v-model="keyword"
          type="text"
          placeholder="搜索文章..."
          @input="handleSearch"
      />
    </view>

    <!-- 骨架屏（解决白屏） -->
    <view v-if="showSkeleton" class="skeleton-container">
      <view class="skeleton-item" v-for="i in 5" :key="i">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-content">
          <view class="skeleton-line"></view>
          <view class="skeleton-line short"></view>
        </view>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error && !firstLoading" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button @click="retry" class="retry-btn">重试</button>
    </view>

    <!-- 列表内容 -->
    <scroll-view
        v-else
        class="list-container"
        scroll-y
        @scrolltolower="onLoadMore"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="handleRefresh"
    >
      <!-- 空数据 -->
      <view v-if="showEmpty" class="empty-container">
        <text class="empty-text">暂无数据</text>
      </view>

      <!-- 列表 -->
      <view v-else class="list">
        <view
            v-for="item in list"
            :key="item.id"
            class="list-item"
        >
          <text class="title">{{ item.title }}</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="showLoadMore" class="loadmore-wrapper">
        <text>加载中...</text>
      </view>

      <!-- 到底提示 -->
      <view v-if="showFinished" class="finished-wrapper">
        <text class="finished-text">—— 已经到底了 ——</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import {
  onLoad,
  onShow,
  onHide,
  onReachBottom,
  onPullDownRefresh
} from '@dcloudio/uni-app'
import { useList } from '@/utils/ylxUtils/composables/useList'

const keyword = ref('')

// 模拟API
const getArticleList = async (params) => {
  console.log('请求参数:', params)
  await new Promise(resolve => setTimeout(resolve, 500))

  let list = Array.from({ length: params.pageSize }, (_, i) => ({
    id: (params.page - 1) * params.pageSize + i + 1,
    title: `文章 ${(params.page - 1) * params.pageSize + i + 1}${params.keyword ? ` - ${params.keyword}` : ''}`
  }))

  // 模拟搜索过滤
  if (params.keyword) {
    list = list.filter(item => item.title.includes(params.keyword))
  }

  return {
    data: {
      list,
      total: params.keyword ? 15 : 35
    }
  }
}

const {
  list,
  loading,
  loadMore,
  finished,
  empty,
  error,
  firstLoading,
  showSkeleton,
  showEmpty,
  showFinished,
  showLoadMore,
  onRefresh,
  onLoadMore,
  onSearch,
  retry
} = useList({
  fetchListApi: getArticleList,
  pageSize: 10,
  immediate: true,
  debounceDelay: 500,   // 搜索防抖 500ms
  throttleDelay: 1000,  // 触底节流 1秒内只触发一次
  enableDedupe: true,   // 请求去重
  params: () => ({       // 动态参数
    keyword: keyword.value
  })
})

// 搜索处理（防抖已内置）
const handleSearch = () => {
  onSearch({ keyword: keyword.value })
}

// 刷新
const refreshing = ref(false)
const handleRefresh = async () => {
  refreshing.value = true
  await onRefresh()
  refreshing.value = false
}
</script>

<style scoped>
.page {
  height: 100vh;
  background: #f5f5f5;
}

.search-box {
  padding: 20rpx 30rpx;
  background: #fff;
}

.search-box input {
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
}

/* 骨架屏 */
.skeleton-container {
  padding: 20rpx;
}

.skeleton-item {
  display: flex;
  padding: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #e0e0e0;
  margin-right: 20rpx;
}

.skeleton-content {
  flex: 1;
}

.skeleton-line {
  height: 32rpx;
  background: #e0e0e0;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.skeleton-line.short {
  width: 60%;
}

/* 列表 */
.list-container {
  height: calc(100vh - 110rpx);
}

.list {
  padding: 20rpx;
}

.list-item {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
}

.title {
  font-size: 28rpx;
  color: #333;
}

.loadmore-wrapper,
.finished-wrapper {
  padding: 30rpx 0;
  text-align: center;
}

.finished-text {
  color: #999;
  font-size: 26rpx;
}

.empty-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 16rpx 32rpx;
  background: #07c160;
  color: #fff;
  border-radius: 40rpx;
}
</style>
