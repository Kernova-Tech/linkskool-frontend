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
  title: 'Holiday camp',
  description: 'Register your child.',
  logoUrl: null,
  bannerUrl: null,
  accepting: true,
  closedMessage: null,
  collectEmail: true,
  onePerEmail: true,
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
  })

  it('draws every field and keeps the page out of search engines', async () => {
    get.mockResolvedValue(form)
    const w = await render()

    expect(get).toHaveBeenCalledWith('aFzhvB9qgT')
    expect(w.text()).toContain('Holiday camp')
    expect(w.text()).toContain('About the class')
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
    expect(w.text()).toContain('Enter your email address.')
    expect(w.text()).toContain('This question needs an answer.')
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

    expect(submit).toHaveBeenCalledWith('aFzhvB9qgT', { name1: 'Ada', cls1: 'o2', days: ['mo', 'tu'] }, 'parent@example.com', '')
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
    expect(w.text()).toContain('We could not find this form')
    w.unmount()
  })
})
