import { Icon, type IconName } from './Icon'
export function ScreenHeader({ title, description, icon }: { title: string; description: string; icon: IconName }) {
  return <header className="screen-header">
    <span className="screen-emblem"><Icon name={icon} /></span>
    <h1>{title}</h1><p>{description}</p>
  </header>
}
