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
  | 'section'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  help: string | null
  required: boolean
  options?: { id: string; label: string }[]
}

export interface PublicForm {
  title: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  /** False once closed, past its date or full; then there are no fields. */
  accepting: boolean
  closedMessage: string | null
  collectEmail: boolean
  onePerEmail: boolean
  fields: FormField[]
}

/** Field id => the answer: text, an option id, or option ids for checkboxes. */
export type FormAnswers = Record<string, string | string[]>
