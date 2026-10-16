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
  /** File questions: what kind of file, and the largest in MB. */
  accept?: 'documents' | 'images' | 'any'
  maxMb?: number
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
  mine: { status: 'pending' | 'approved' | 'rejected'; note: string | null; sentAt: string } | null
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
