import type { FormField } from '@/api/models'

type Kind = NonNullable<FormField['accept']>

/** What each kind of file question takes. Mirrors the API, which checks again. */
export const FILE_KINDS: Record<Kind, { label: string; extensions: string[]; accept: string }> = (() => {
  const documents = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt']
  const images = ['jpg', 'jpeg', 'png', 'webp']
  const any = [...documents, ...images, 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'zip']
  const kind = (label: string, extensions: string[]) => ({ label, extensions, accept: extensions.map((e) => `.${e}`).join(',') })

  return {
    documents: kind('PDF, Word or text', documents),
    images: kind('JPG, PNG or WEBP', images),
    any: kind('Documents, images, spreadsheets, slides or ZIP', any),
  }
})()

export const formatSize = (bytes: number) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
