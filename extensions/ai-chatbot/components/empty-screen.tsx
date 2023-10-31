import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    "heading": "Open a File in VSCode",
    "message": "Please open the file '/path/to/file' in VSCode"
  },
  {
    "heading": "Send an email",
    "message": "Please send an email to 'example@example.com' with the subject 'Meeting Reminder' and the text 'Just a reminder about the meeting tomorrow at 10 AM.'"
  },
  {
    "heading": "Write to a file",
    "message": "Can you please write 'This is an example text.' to the file named 'example.txt'?"
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="bg-background rounded-lg border p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to Saiku Chatbot!
        </h1>
        <p className="text-muted-foreground mb-2 leading-normal">
          This is an open source AI chatbot app template built with{' '}
          <ExternalLink href="https://github.com/nooqta/saiku">
            Saiku{' '}
          </ExternalLink>
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and{' '}
          <ExternalLink href="https://vercel.com/storage/kv">
            Vercel KV
          </ExternalLink>
          .
        </p>
        <p className="text-muted-foreground leading-normal">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="text-muted-foreground mr-2" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
