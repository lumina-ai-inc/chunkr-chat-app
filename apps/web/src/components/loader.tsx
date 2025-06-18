import Image from 'next/image'

export default function Loader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Image src="/logo-transparent.svg" alt="logo" width={40} height={40} />
    </div>
  )
}
