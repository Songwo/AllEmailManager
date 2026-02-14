'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Step {
  id: string;
  title: string;
  description: string;
  path: string;
  completed: boolean;
}

export function OnboardingGuide() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps: Step[] = [
    {
      id: 'add-email',
      title: '添加邮箱账户',
      description: '连接你的第一个邮箱，开始接收邮件',
      path: '/dashboard/accounts',
      completed: false
    },
    {
      id: 'add-channel',
      title: '创建推送渠道',
      description: '配置飞书、企业微信或 Telegram 推送',
      path: '/dashboard/channels',
      completed: false
    },
    {
      id: 'add-rule',
      title: '创建过滤规则',
      description: '设置自动化规则，智能处理邮件',
      path: '/dashboard/filters',
      completed: false
    },
    {
      id: 'start-listening',
      title: '启动邮件监听',
      description: '开始实时监听新邮件',
      path: '/dashboard/accounts',
      completed: false
    }
  ]

  useEffect(() => {
    // 检查是否是新用户（可以从 localStorage 或 API 获取）
    const hasSeenGuide = localStorage.getItem('hasSeenOnboardingGuide')
    const hasCompletedSetup = localStorage.getItem('hasCompletedSetup')

    if (!hasSeenGuide && !hasCompletedSetup) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('hasSeenOnboardingGuide', 'true')
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
      localStorage.setItem('hasCompletedSetup', 'true')
    }
  }

  const handleGoToStep = (path: string) => {
    handleClose()
    router.push(path)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-2xl border border-border shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                欢迎使用 EmailHub！👋
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground">
              让我们用 5 分钟完成初始配置，开始接收邮件推送通知
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                进度: {currentStep + 1} / {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-primary"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="p-6">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all ${
                    index === currentStep
                      ? 'border-primary bg-primary/5'
                      : index < currentStep
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {index < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${
                        index === currentStep ? 'text-primary' : 'text-foreground'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {index === currentStep && (
                        <motion.button
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleGoToStep(step.path)}
                          className="mt-3 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          立即配置
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                跳过引导
              </button>
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 text-sm font-medium bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    上一步
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {currentStep === steps.length - 1 ? '完成' : '下一步'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
