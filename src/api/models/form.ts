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

export interface PublicForm {
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
  fields: FormField[]
}

/** Field id => the answer: text, an option id, or option ids for checkboxes. */
export type FormAnswers = Record<string, string | string[]>
