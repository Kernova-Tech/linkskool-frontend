/** A form shared by the Linkskool team, as the person filling it sees it. */

export type FormFieldType =
  | 'short_text'
  | 'paragraph'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkboxes'
  | 'file'
  | 'section'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  help: string | null
  required: boolean
  options?: { id: string; label: string }[]
  /** File questions: what kind of file, the largest in MB, and how many (1 to 10). */
  accept?: 'documents' | 'images' | 'any'
  maxMb?: number
  maxFiles?: number
}

/** The button after sending; auto goes there by itself. */
export interface FormNextAction {
  label: string
  url: string
  auto: boolean
}

/** A task: whose staff do it, what they copy, and where this person stands. */
export interface FormTask {
  organization: string | null
  deadline: string | null
  shareKit: { kind: 'text' | 'link'; label: string; value: string }[]
  /** The signed-in person's response, or null before they send one. */
  mine: {
    status: 'pending' | 'approved' | 'rejected'
    note: string | null
    sentAt: string
    attempt: number
    /** Once approved, a card to share the win, when the task allows it. */
    shareUrl: string | null
  } | null
}

export interface PublicForm {
  /** marketing shows the banner as a hero image; task is staff proof, reviewed. */
  type: 'standard' | 'marketing' | 'task'
  task?: FormTask
  title: string
  description: string | null
  bannerUrl: string | null
  /** Partners' logos, in order. */
  logos: string[]
  /** False once closed, past its date or full; then there are no fields. */
  accepting: boolean
  closedMessage: string | null
  collectEmail: boolean
  onePerEmail: boolean
  /** Google sign-in first; the email then comes from the account. */
  requireSignIn: boolean
  fields: FormField[]
}

/** Who is signed in to fill a sign-in form, for this visit only. */
export interface FormSession {
  accessToken: string
  name: string
  email: string
}

/** Field id => the answer: text, an option id, or option ids for checkboxes. */
export type FormAnswers = Record<string, string | string[]>

/** One of the signed-in person's tasks, across the organizations they work for. */
export interface MyTask {
  title: string
  organization: string
  logoUrl: string | null
  link: string
  deadline: string | null
  open: boolean
  status: 'not_started' | 'pending' | 'approved' | 'rejected'
  note: string | null
  attempt: number
  sentAt: string | null
  shareUrl: string | null
  /** Open, and not sent yet or sent back. */
  needsAction: boolean
}
