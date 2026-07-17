/**
 * ChatBubble — 聊天气泡
 * - 用户气泡：右侧，暖杏色背景
 * - AI 气泡：左侧，浅米色背景
 * - AI 回复下方有"为什么这样回？"链接（鼠尾草绿，带下划线）
 * - loading 时显示打字机三点动画
 * - error 时显示小蜡烛熄灭图标 + 重试
 * - 展开时渲染 MirrorPanel / LabVersions
 */
import type { ChatMessage } from '@/types'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import MirrorPanel from './MirrorPanel'
import LabVersions from './LabVersions'

interface Props {
  message: ChatMessage
  onToggleMirror: (id: string) => void
  onRetry?: (id: string) => void
}

/** 打字机三点 */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-ink/30 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-ink/30 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-ink/30" />
    </span>
  )
}

export default function ChatBubble({ message, onToggleMirror, onRetry }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex animate-fade-in-up justify-end">
        <div className="max-w-[78%] rounded-3xl rounded-tr-lg bg-apricot px-4 py-2.5 text-ink shadow-soft">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.text}
          </p>
        </div>
      </div>
    )
  }

  // AI 消息
  const hasError = message.error

  return (
    <div className="flex animate-fade-in-up justify-start">
      <div className="w-full max-w-[85%]">
        <div className="flex items-start gap-2">
          {/* 小台灯头像 */}
          <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-light/50 text-amber">
            <HandDrawnIcon name="lamp" className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            {/* 气泡 */}
            <div className="inline-block max-w-full rounded-3xl rounded-tl-lg border border-ink/5 bg-cream-50 px-4 py-2.5 shadow-soft">
              {hasError ? (
                <div className="flex items-center gap-2 text-ink/60">
                  <span className="opacity-50 grayscale">
                    <HandDrawnIcon name="candle" className="h-5 w-5" />
                  </span>
                  <span className="text-sm">这盏灯好像闪了一下，没能回上来。</span>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(message.id)}
                      className="ml-1 text-sm font-semibold text-sage-deep underline-offset-2 hover:underline"
                    >
                      再试一次
                    </button>
                  )}
                </div>
              ) : message.text ? (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
                  {message.text}
                </p>
              ) : (
                <TypingDots />
              )}
            </div>

            {/* 为什么这样回？ */}
            {!hasError && message.mirror && (
              <div className="mt-1.5 pl-1">
                <button
                  onClick={() => onToggleMirror(message.id)}
                  className="group inline-flex items-center gap-1 text-xs font-medium text-sage-deep underline decoration-sage/40 decoration-1 underline-offset-2 transition-colors hover:text-sage hover:decoration-sage"
                >
                  <HandDrawnIcon
                    name="mirror"
                    className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
                  />
                  为什么这样回？
                  <HandDrawnIcon
                    name="chevron-down"
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      message.mirrorOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Mirror 面板：手风琴展开 */}
            {message.mirrorOpen && message.mirror && (
              <div
                className="grid transition-all duration-300 ease-soft"
                style={{
                  gridTemplateRows: message.mirrorOpen ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <MirrorPanel data={message.mirror} />
                </div>
              </div>
            )}

            {/* Conversation Lab 多版本 */}
            {(message.labLoaded || message.labLoading) && (
              <LabVersions
                versions={message.labVersions || []}
                loading={message.labLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
