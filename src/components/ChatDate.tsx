import { chatDayLabel, chatTime } from '../lib/chatDates'
import { formatEventTime } from '../features/events/validation'

export function ChatDaySeparator({ day, today }: { day: string; today: string }) {
  return <li className="chat-day-separator"><span>{chatDayLabel(day, today)}</span></li>
}

export function ChatTimestamp({ value }: { value: string }) {
  return <time dateTime={`${value}-03:00`} aria-label={formatEventTime(value)} title={formatEventTime(value)}>{chatTime(value)}</time>
}
