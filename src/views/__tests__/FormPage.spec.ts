import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import type { PublicForm } from '@/api/models'

const get = vi.fn()
const submit = vi.fn()
vi.mock('@/api/services', () => ({ formService: { get: (...a: unknown[]) => get(...a), submit: (...a: unknown[]) => submit(...a) } }))

const { default: FormPage } = await import('../FormPage.vue')

const form: PublicForm = {
  type: 'standard',
  title: 'Holiday camp',
  description: '<p>Register your <strong>child</strong>.</p><p></p><ul><li>Ages 10 to 14</li></ul><p><a href="https://example.com">Camp details</a><script>alert(1)</script><img src=x onerror="alert(1)"></p>',
  bannerUrl: null,
  logos: ['https://api.test/logo-a.png', 'https://api.test/logo-b.png'],
  accepting: true,
  closedMessage: null,
  collectEmail: true,
  onePerEmail: true,
  requireSignIn: false,
  fields: [
    { id: 'name1', type: 'short_text', label: 'Child’s name', help: null, required: true },
    { id: 'sec1', type: 'section', label: 'About the class', help: null, required: false },
    { id: 'cls1', type: 'radio', label: 'Class', help: null, required: true, options: [{ id: 'o1', label: 'JSS1' }, { id: 'o2', label: 'JSS2' }] },
    { id: 'days', type: 'checkboxes', label: 'Days', help: null, required: false, options: [{ id: 'mo', label: 'Mon' }, { id: 'tu', label: 'Tue' }] },
    { id: 'tel1', type: 'phone', label: 'Parent phone', help: null, required: false },
  ],
}

const render = async (token = 'aFzhvB9qgT') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/f/:token', component: FormPage }, { path: '/', component: { template: '<div />' } }] })
  router.push(`/f/${token}`)
  await router.isReady()
  const wrapper = mount(FormPage, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('FormPage', () => {
  beforeEach(() => {
    get.mockReset()
    submit.mockReset()
    window.scrollTo = vi.fn()
    // jsdom has no layout; the page scrolls to the first mistake.
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('draws every field and keeps the page out of search engines', async () => {
    get.mockResolvedValue(form)
    const w = await render()

    expect(get).toHaveBeenCalledWith('aFzhvB9qgT', undefined)
    expect(w.text()).toContain('Holiday camp')
    expect(w.text()).toContain('About the class')
    // The description is shown formatted, with anything unsafe gone.
    const description = w.find('header div.leading-relaxed')
    expect(description.find('strong').text()).toBe('child')
    expect(description.find('li').text()).toBe('Ages 10 to 14')
    expect(description.find('a').attributes()).toMatchObject({ href: 'https://example.com', target: '_blank' })
    expect(description.html()).not.toContain('script')
    expect(description.find('img').exists()).toBe(false)
    // A blank line left in the editor stays a blank line.
    expect(description.findAll('p').some((p) => p.element.innerHTML === '')).toBe(true)
    expect(w.findAll('img[alt^="Partner logo"]')).toHaveLength(2)
    expect(w.text()).toContain('* Required')
    expect(w.findAll('input[type="radio"]')).toHaveLength(2)
    expect(w.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
    w.unmount()
    expect(document.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('stops a send with a missing answer or a bad phone number', async () => {
    get.mockResolvedValue(form)
    const w = await render()

    await w.find('#field-tel1').setValue('abc')
    await w.find('form').trigger('submit')

    expect(submit).not.toHaveBeenCalled()
    expect(w.text()).toContain('Enter a valid email address.')
    expect(w.text()).toContain('This is a required question.')
    expect(w.text()).toContain('Enter a valid phone number.')
    w.unmount()
  })

  it('sends option ids and shows the form’s thank-you message', async () => {
    get.mockResolvedValue(form)
    submit.mockResolvedValue({ message: 'See you at camp!' })
    const w = await render()

    await w.find('#respondent-email').setValue('parent@example.com')
    await w.find('#field-name1').setValue('Ada')
    await w.find('input[type="radio"][value="o2"]').setValue(true)
    await w.find('input[type="checkbox"][value="mo"]').setValue(true)
    await w.find('input[type="checkbox"][value="tu"]').setValue(true)
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(submit).toHaveBeenCalledWith('aFzhvB9qgT', { name1: 'Ada', cls1: 'o2', days: ['mo', 'tu'] }, 'parent@example.com', '', {}, undefined)
    expect(w.text()).toContain('See you at camp!')
    // One response per email: no second response offered.
    expect(w.text()).not.toContain('Send another response')
    w.unmount()
  })

  it('shows the server’s reason when it turns a response away', async () => {
    get.mockResolvedValue({ ...form, collectEmail: false, onePerEmail: false })
    submit.mockRejectedValue(new ApiError('This form has all the responses it needs.', 422))
    const w = await render()

    await w.find('#field-name1').setValue('Ada')
    await w.find('input[type="radio"][value="o1"]').setValue(true)
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toBe('This form has all the responses it needs.')
    w.unmount()
  })

  it('says when a form is closed, and when a link leads nowhere', async () => {
    get.mockResolvedValue({ ...form, accepting: false, closedMessage: 'Registration has closed.', fields: [] })
    let w = await render()
    expect(w.text()).toContain('Registration has closed.')
    expect(w.find('form').exists()).toBe(false)
    w.unmount()

    get.mockRejectedValue(new ApiError('Not found', 404))
    w = await render('zzzzzzzzzz')
    expect(w.text()).toContain('This form could not be found')
    w.unmount()
  })

  it('checks a file before sending and sends it with the answers', async () => {
    get.mockResolvedValue({
      ...form,
      collectEmail: false,
      onePerEmail: false,
      fields: [{ id: 'cv01', type: 'file', label: 'CV', help: null, required: true, accept: 'documents', maxMb: 1 }],
    })
    submit.mockResolvedValue({ message: 'Thanks' })
    const w = await render()
    const input = w.find('#field-cv01')
    const attach = async (file: File) => {
      Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
      await input.trigger('change')
    }

    expect(input.attributes('accept')).toBe('.pdf,.doc,.docx,.odt,.rtf,.txt')
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('This question needs a file.')

    await attach(new File(['x'], 'photo.png'))
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('“photo.png” is not a PDF, Word or text file.')

    await attach(new File([new Uint8Array(2 * 1048576)], 'big.pdf'))
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('“big.pdf” is too large. The limit is 1 MB each.')
    expect(submit).not.toHaveBeenCalled()

    const cv = new File(['%PDF'], 'Ada CV.pdf')
    await attach(cv)
    expect(w.text()).toContain('Ada CV.pdf')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(submit).toHaveBeenCalledWith('aFzhvB9qgT', {}, '', '', { cv01: [cv] }, undefined)
    w.unmount()
  })

  it('takes several files on a question that allows them, up to its limit', async () => {
    get.mockResolvedValue({
      title: 'Proof',
      description: null,
      bannerUrl: null,
      logos: [],
      accepting: true,
      closedMessage: null,
      collectEmail: false,
      onePerEmail: false,
      fields: [
        { id: 'shots', type: 'file', label: 'Screenshots', help: null, required: true, accept: 'images', maxMb: 5, maxFiles: 2 },
      ],
    })
    submit.mockResolvedValue({ message: 'Thanks' })
    const w = await render()
    const input = w.find('#field-shots')
    expect(input.attributes('multiple')).toBeDefined()

    const a = new File(['a'], 'a.png', { type: 'image/png' })
    const b = new File(['b'], 'b.png', { type: 'image/png' })
    const c = new File(['c'], 'c.png', { type: 'image/png' })
    Object.defineProperty(input.element, 'files', { value: [a, b, c], configurable: true })
    await input.trigger('change')
    // The third is past the limit and is left out.
    expect(w.text()).toContain('a.png')
    expect(w.text()).toContain('b.png')
    expect(w.text()).not.toContain('c.png')
    expect(w.text()).toContain('(2 added)')

    await w.find('form').trigger('submit')
    await flushPromises()
    expect(submit).toHaveBeenCalledWith('aFzhvB9qgT', {}, '', '', { shots: [a, b] }, undefined)
    w.unmount()
  })
})
