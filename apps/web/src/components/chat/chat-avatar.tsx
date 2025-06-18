import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ChatAvatar() {
  return (
    <Avatar className="rounded-full bg-black">
      <AvatarImage className="p-1" src={'/logo-transparent.svg'} />
      <AvatarFallback>CA</AvatarFallback>
    </Avatar>
  )
}
