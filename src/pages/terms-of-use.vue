<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { usePageMeta } from '@/composables/usePageMeta'

usePageMeta({
    title: 'Terms of Use | LinkSkool',
    description:
        'LinkSkool Terms of Use - Review the terms that govern access to and use of LinkSkool applications, website, and related educational services.',
    keywords: 'terms of use, terms of service, user agreement, LinkSkool',
    url: 'https://linkskool.com/terms-of-use',
    image: 'https://linkskool.com/assets/og-image.png',
    type: 'article',
})
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <AppHeader />

        <section class="pt-24 pb-12 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
                    Terms of Use
                </h1>
                <p class="text-xl text-blue-100">
                    Last updated: June 23, 2026
                </p>
            </div>
        </section>

        <section class="py-16 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="prose prose-lg max-w-none">
                    <div class="mb-12">
                        <p class="text-lg text-gray-700 leading-relaxed">
                            These Terms of Use ("Terms") govern your access to and use of the
                            <strong>LinkSkool</strong> mobile application, desktop application, website, and related
                            services (collectively, the "Service").
                        </p>
                        <p class="text-lg text-gray-700 leading-relaxed mt-4">
                            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree
                            with these Terms, please do not use the Service.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            1. Interpretation and Definitions
                        </h2>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">Definitions</h3>
                        <ul class="space-y-3 text-gray-700">
                            <li><strong>Account</strong> means a registered user account required to access certain
                                parts of the Service.</li>
                            <li><strong>Application</strong> means the LinkSkool mobile and desktop applications.</li>
                            <li><strong>Company</strong> means Linkskool Online Ventures Limited, No. 86 Ogui Road, Opposite
                                Stadium, Enugu, Nigeria.</li>
                            <li><strong>Content</strong> means educational materials, text, images, videos, assessments,
                                documents, and other information available through the Service.</li>
                            <li><strong>Device</strong> means any device capable of accessing the Service.</li>
                            <li><strong>Service</strong> means the LinkSkool platform, applications, website, and
                                related services.</li>
                            <li><strong>You</strong> means the individual, institution, organization, or legal entity
                                accessing or using the Service.</li>
                        </ul>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            2. Eligibility and Account Registration
                        </h2>
                        <p class="text-gray-700 mb-4">
                            You must be legally capable of entering into a binding agreement to use the Service.
                        </p>
                        <p class="text-gray-700 mb-4">
                            If you are under the age of 18, you may use the Service only with the consent and
                            supervision of a parent, guardian, school, or authorized institution.
                        </p>
                        <p class="text-gray-700 mb-4">
                            You are responsible for:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-4">
                            <li>Maintaining the confidentiality of your login credentials.</li>
                            <li>All activities that occur under your account.</li>
                            <li>Providing accurate and up-to-date information during registration.</li>
                        </ul>
                        <p class="text-gray-700">
                            You must notify us immediately of any unauthorized use of your account.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            3. Acceptable Use
                        </h2>
                        <p class="text-gray-700 mb-4">
                            You agree to use the Service only for lawful and educational purposes.
                        </p>
                        <p class="text-gray-700 mb-4">
                            You must not:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Attempt unauthorized access to systems, accounts, or data.</li>
                            <li>Disrupt, interfere with, or compromise the security of the Service.</li>
                            <li>Upload malicious software, viruses, or harmful code.</li>
                            <li>Use the Service to distribute unlawful, offensive, fraudulent, or misleading content.
                            </li>
                            <li>Copy, reproduce, sell, resell, or commercially exploit any part of the Service without
                                written authorization.</li>
                        </ul>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            4. Educational Content
                        </h2>
                        <p class="text-gray-700 mb-4">
                            LinkSkool provides educational and informational content for learning purposes.
                        </p>
                        <p class="text-gray-700 mb-4">
                            While we strive to provide accurate and useful content, we do not guarantee:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-4">
                            <li>Academic success</li>
                            <li>Examination outcomes</li>
                            <li>Admission opportunities</li>
                            <li>Employment opportunities</li>
                            <li>Professional certifications</li>
                        </ul>
                        <p class="text-gray-700">
                            Content may be modified, updated, replaced, or removed at any time without prior notice.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            5. Intellectual Property
                        </h2>
                        <p class="text-gray-700 mb-4">
                            All intellectual property rights relating to the Service, including software, designs, logos,
                            trademarks, databases, educational content, and other materials, belong to LinkSkool or its
                            licensors.
                        </p>
                        <p class="text-gray-700">
                            You are granted a limited, non-exclusive, non-transferable, and revocable license to use the
                            Service solely for its intended educational purposes.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            6. Payments and Subscriptions
                        </h2>
                        <p class="text-gray-700 mb-4">
                            Certain features of the Service may require payment, subscription, or enrollment fees.
                        </p>
                        <p class="text-gray-700 mb-4">
                            Applicable fees will be disclosed before purchase.
                        </p>
                        <p class="text-gray-700 mb-4">
                            Unless otherwise stated or required by applicable law:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Payments are non-refundable.</li>
                            <li>Subscription fees may be renewed according to the selected plan.</li>
                            <li>Failure to make payment may result in suspension of premium features.</li>
                        </ul>
                    </div>

                    <div class="mb-12 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6">
                            7. Email Communications
                        </h2>
                        <p class="text-gray-700 mb-4">
                            By creating an account, enrolling in courses, subscribing to services, or otherwise using the
                            Service, you consent to receive communications from LinkSkool.
                        </p>
                        <p class="text-gray-700 mb-4">
                            These communications may include:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-4">
                            <li>Account verification and OTP emails</li>
                            <li>Password reset emails</li>
                            <li>Welcome emails</li>
                            <li>Course enrollment confirmations</li>
                            <li>Assignment reminders</li>
                            <li>Event notifications</li>
                            <li>Course and lesson updates</li>
                            <li>Subscription and payment receipts</li>
                            <li>Educational announcements</li>
                            <li>Academic opportunities and updates</li>
                            <li>Platform notifications and service-related communications</li>
                        </ul>
                        <p class="text-gray-700">
                            Where required by law, users may opt out of non-essential promotional communications.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            8. Termination
                        </h2>
                        <p class="text-gray-700 mb-4">
                            We reserve the right to suspend, restrict, or terminate access to the Service at any time if:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-4">
                            <li>These Terms are violated.</li>
                            <li>Fraudulent or unlawful activity is detected.</li>
                            <li>Continued access may harm the Service, users, or third parties.</li>
                        </ul>
                        <p class="text-gray-700 mb-4">
                            You may stop using the Service at any time.
                        </p>
                        <p class="text-gray-700">
                            Termination does not affect any rights or obligations accrued before termination.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            9. Disclaimer of Warranties
                        </h2>
                        <p class="text-gray-700 mb-4">
                            The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
                        </p>
                        <p class="text-gray-700 mb-4">
                            To the fullest extent permitted by law, LinkSkool disclaims all warranties, whether express,
                            implied, statutory, or otherwise, including warranties of:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Merchantability</li>
                            <li>Fitness for a particular purpose</li>
                            <li>Non-infringement</li>
                            <li>Availability</li>
                            <li>Accuracy</li>
                            <li>Reliability</li>
                        </ul>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            10. Limitation of Liability
                        </h2>
                        <p class="text-gray-700 mb-4">
                            To the maximum extent permitted by applicable law, LinkSkool, its directors, employees,
                            partners, affiliates, and licensors shall not be liable for any indirect, incidental,
                            consequential, special, or punitive damages arising from or related to your use of the
                            Service.
                        </p>
                        <p class="text-gray-700">
                            This limitation applies even if we have been advised of the possibility of such damages.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            11. Privacy
                        </h2>
                        <p class="text-gray-700">
                            Your use of the Service is also governed by our
                            <RouterLink to="/privacy-policy" class="text-blue-600 hover:underline font-semibold">
                                Privacy Policy</RouterLink>, which explains how we collect, use, process, store, and
                            protect personal information.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            12. Governing Law
                        </h2>
                        <p class="text-gray-700">
                            These Terms shall be governed by and interpreted in accordance with the laws of the Federal
                            Republic of Nigeria, without regard to conflict of law principles.
                        </p>
                    </div>

                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            13. Changes to These Terms
                        </h2>
                        <p class="text-gray-700 mb-4">
                            We may update these Terms from time to time.
                        </p>
                        <p class="text-gray-700 mb-4">
                            Updated versions will be published on the Service with a revised effective date.
                        </p>
                        <p class="text-gray-700">
                            Your continued use of the Service after changes become effective constitutes acceptance of
                            the revised Terms.
                        </p>
                    </div>

                    <div
                        class="mt-16 p-8 bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl border border-blue-200">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6">
                            14. Contact Information
                        </h2>
                        <p class="text-gray-700 mb-6">
                            If you have any questions regarding these Terms, please contact us:
                        </p>

                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-building text-blue-600 text-xl mt-1"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Company</p>
                                    <p class="text-gray-700">Linkskool Online Ventures Limited</p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-blue-600 text-xl mt-1"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Address</p>
                                    <p class="text-gray-700">
                                        No. 86 Ogui Road, Opposite Stadium<br>
                                        Enugu, Nigeria
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-globe text-blue-600 text-xl mt-1"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Website</p>
                                    <a href="https://linkskool.com" class="text-blue-600 hover:underline">
                                        https://linkskool.com
                                    </a>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-envelope text-blue-600 text-xl mt-1"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Email</p>
                                    <a href="mailto:support@linkskool.com"
                                        class="text-blue-600 hover:underline">support@linkskool.com</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <AppFooter />
    </div>
</template>

<style scoped>
.prose {
    max-width: none;
}

.prose h2 {
    scroll-margin-top: 100px;
}

.prose h3 {
    scroll-margin-top: 100px;
}

.prose ul {
    padding-left: 1.5rem;
}
</style>
