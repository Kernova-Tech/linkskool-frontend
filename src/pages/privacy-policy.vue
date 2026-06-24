<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { usePageMeta } from '@/composables/usePageMeta'

// Set page meta tags for SEO
usePageMeta({
    title: 'Privacy Policy | Linkskool',
    description: 'Linkskool Privacy Policy - Learn how we collect, use, store, and protect your personal data in compliance with GDPR and Nigeria Data Protection Act.',
    keywords: 'privacy policy, data protection, GDPR, NDPA, user privacy, Linkskool',
    url: 'https://linkskool.com/privacy-policy',
    image: 'https://linkskool.com/assets/og-image.png',
    type: 'article',
})
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <AppHeader />

        <!-- Hero Section -->
        <section class="pt-24 pb-12 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
                    Privacy Policy
                </h1>
                <p class="text-xl text-blue-100">
                    Last updated: January 23, 2026
                </p>
            </div>
        </section>

        <!-- Content Section -->
        <section class="py-16 bg-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="prose prose-lg max-w-none">
                    <!-- Introduction -->
                    <div class="mb-12">
                        <p class="text-lg text-gray-700 leading-relaxed">
                            This Privacy Policy explains how <strong>Linkskool</strong> ("we", "our", "us") collects,
                            uses, stores, shares, and protects personal data when you use the Linkskool mobile
                            application, desktop application, and related services (collectively, the "Service").
                        </p>
                        <p class="text-lg text-gray-700 leading-relaxed mt-4">
                            We are committed to protecting your privacy and handling your personal data transparently,
                            securely, and in compliance with applicable data protection laws, including the General Data
                            Protection Regulation (GDPR) and the Nigeria Data Protection Act (NDPA).
                        </p>
                    </div>

                    <!-- 1. Interpretation and Definitions -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            1. Interpretation and Definitions
                        </h2>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">Interpretation</h3>
                        <p class="text-gray-700 mb-4">
                            Words with capitalized initial letters have meanings defined below, whether used in singular
                            or plural form.
                        </p>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">Definitions</h3>
                        <ul class="space-y-3 text-gray-700">
                            <li><strong>Account</strong> – A unique account created to access the Service.</li>
                            <li><strong>Application</strong> – The Linkskool mobile and desktop software.</li>
                            <li><strong>Company</strong> – Linkskool Online Ventures Limited, No. 86 Ogui Road, opposite Stadium,
                                Enugu, Nigeria.</li>
                            <li><strong>Device</strong> – Any device capable of accessing the Service.</li>
                            <li><strong>Personal Data</strong> – Any information relating to an identified or
                                identifiable individual.</li>
                            <li><strong>Usage Data</strong> – Data collected automatically from the Service.</li>
                            <li><strong>Service Provider</strong> – Any third party that processes data on our behalf.
                            </li>
                            <li><strong>You</strong> – The individual or legal entity using the Service.</li>
                        </ul>
                    </div>

                    <!-- 2. Legal Basis for Processing -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            2. Legal Basis for Processing (GDPR)
                        </h2>
                        <p class="text-gray-700 mb-4">
                            Under GDPR, we process personal data only where we have a lawful basis, including:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Your explicit consent</li>
                            <li>Performance of a contract</li>
                            <li>Compliance with legal obligations</li>
                            <li>Legitimate interests, where they do not override your rights</li>
                        </ul>
                    </div>

                    <!-- 3. Data We Collect -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            3. Data We Collect
                        </h2>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">3.1 Personal Data</h3>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-6">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Account profile information (profile picture, bio, preferences)</li>
                            <li>Payment information (processed securely by third-party payment providers)</li>
                        </ul>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">3.2 Usage Data</h3>
                        <p class="text-gray-700 mb-4">
                            Usage Data may include IP address, device identifiers, operating system, browser type,
                            application version, access times, pages viewed, and interaction logs with courses and
                            content.
                        </p>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4 mt-6">3.3 Device Permissions</h3>
                        <p class="text-gray-700 mb-4">
                            With your permission, we may access your device camera or media library to support features
                            such as profile images or educational content uploads.
                        </p>
                        <p class="text-gray-700">
                            You may revoke these permissions at any time via your device settings.
                        </p>
                    </div>

                    <!-- 4. How We Use Your Data -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            4. How We Use Your Data
                        </h2>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>To provide and maintain the Service</li>
                            <li>To authenticate users and manage accounts</li>
                            <li>To deliver educational content and features</li>
                            <li>To process enrollments and payments</li>
                            <li>To communicate service-related updates, course announcements, and promotional materials
                                (with your consent)</li>
                            <li>To improve performance, security, and user experience through analytics</li>
                            <li>To respond to support requests and inquiries</li>
                            <li>To comply with legal and regulatory requirements</li>
                            <li>To detect and prevent fraud, abuse, or security incidents</li>
                        </ul>
                    </div>

                    <!-- 5. Data Sharing and Disclosure -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            5. Data Sharing and Disclosure
                        </h2>
                        <p class="text-gray-700 mb-4">
                            <strong>We do not sell your personal data.</strong>
                        </p>
                        <p class="text-gray-700 mb-4">
                            We may share data only with:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li><strong>Trusted Service Providers</strong> under strict confidentiality agreements
                                (e.g., payment processors, cloud hosting providers, email service providers)</li>
                            <li><strong>Affiliates</strong> operating under this same Privacy Policy</li>
                            <li><strong>Legal authorities</strong> where required by law, court order, or government
                                regulation</li>
                            <li><strong>Business successors</strong> in the event of a merger, acquisition, or sale of
                                assets</li>
                            <li><strong>With your consent</strong> for specific purposes you have authorized</li>
                        </ul>
                    </div>

                    <!-- 6. Data Retention -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            6. Data Retention
                        </h2>
                        <p class="text-gray-700 mb-4">
                            We retain personal data only for as long as necessary to fulfill the purposes outlined in
                            this policy, unless a longer retention period is required or permitted by law.
                        </p>
                        <p class="text-gray-700 mb-4">
                            Specifically:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li><strong>Active accounts:</strong> Data is retained while your account remains active
                            </li>
                            <li><strong>Inactive accounts:</strong> Data may be anonymized or deleted after 3 years of
                                inactivity</li>
                            <li><strong>Course completion records:</strong> Retained for 7 years for certification
                                purposes</li>
                            <li><strong>Payment records:</strong> Retained for 7 years as required by tax and financial
                                regulations</li>
                            <li><strong>Marketing communications:</strong> Retained until you unsubscribe or withdraw
                                consent</li>
                        </ul>
                    </div>

                    <!-- 7. How We Delete Your Data -->
                    <div class="mb-12 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6">
                            7. How We Delete Your Data
                        </h2>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4">7.1 Account Deletion</h3>
                        <p class="text-gray-700 mb-4">
                            You may request deletion of your account at any time by:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-6">
                            <li>Accessing your account settings and selecting "Delete Account"</li>
                            <li>Contacting our support team at <a href="mailto:privacy@linkskool.com"
                                    class="text-blue-600 hover:underline">privacy@linkskool.com</a></li>
                            <li>Sending a written request to our company address</li>
                        </ul>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4">7.2 Deletion Process</h3>
                        <p class="text-gray-700 mb-4">
                            Upon receiving a valid deletion request:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-6">
                            <li><strong>Within 30 days:</strong> We will permanently delete your personal data from our
                                active systems</li>
                            <li><strong>Within 90 days:</strong> We will remove your data from backup systems</li>
                            <li><strong>Exceptions:</strong> Some data may be retained if required by law (e.g.,
                                transaction records for tax purposes) but will be anonymized where possible</li>
                        </ul>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4">7.3 What Gets Deleted</h3>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mb-6">
                            <li>Personal profile information (name, email, phone, photo)</li>
                            <li>Account credentials and authentication data</li>
                            <li>Course progress and learning history (unless certification records are legally required)
                            </li>
                            <li>Saved preferences and settings</li>
                            <li>Communication history and support tickets (subject to legal retention requirements)</li>
                        </ul>

                        <h3 class="text-2xl font-semibold text-gray-900 mb-4">7.4 What May Be Retained</h3>
                        <p class="text-gray-700 mb-4">
                            Some information may be retained in anonymized form for:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Aggregate analytics and research (with all personal identifiers removed)</li>
                            <li>Legal compliance (e.g., financial records for 7 years as required by law)</li>
                            <li>Security and fraud prevention (e.g., IP addresses for banned accounts)</li>
                        </ul>
                    </div>

                    <!-- 8. International Data Transfers -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            8. International Data Transfers
                        </h2>
                        <p class="text-gray-700 mb-4">
                            Your data may be processed and stored in countries outside your country of residence,
                            including Nigeria and other jurisdictions where our service providers operate.
                        </p>
                        <p class="text-gray-700">
                            Where data is transferred internationally, we ensure appropriate safeguards are in place
                            through:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside mt-4">
                            <li>Standard Contractual Clauses approved by the European Commission</li>
                            <li>Adequacy decisions for countries with equivalent data protection standards</li>
                            <li>Binding corporate rules for transfers within our corporate group</li>
                        </ul>
                    </div>

                    <!-- 9. Your Rights Under GDPR & NDPA -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            9. Your Rights Under GDPR & NDPA
                        </h2>
                        <p class="text-gray-700 mb-4">
                            You have the following rights regarding your personal data:
                        </p>
                        <ul class="space-y-3 text-gray-700">
                            <li><strong>Right to Access:</strong> Request a copy of your personal data we hold</li>
                            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                            <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal
                                obligations)</li>
                            <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain
                                circumstances</li>
                            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or
                                for direct marketing</li>
                            <li><strong>Right to Data Portability:</strong> Receive your data in a structured,
                                machine-readable format</li>
                            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing at any time
                                (without affecting prior lawful processing)</li>
                            <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Nigeria Data
                                Protection Commission or your local data protection authority</li>
                        </ul>
                        <p class="text-gray-700 mt-6">
                            To exercise any of these rights, contact us at <a href="mailto:privacy@linkskool.com"
                                class="text-blue-600 hover:underline font-semibold">privacy@linkskool.com</a>
                        </p>
                    </div>

                    <!-- 10. Security Measures -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            10. Security Measures
                        </h2>
                        <p class="text-gray-700 mb-4">
                            We implement industry-standard security measures to protect your data, including:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                            <li>Regular security audits and vulnerability assessments</li>
                            <li>Access controls and authentication mechanisms</li>
                            <li>Employee training on data protection and security best practices</li>
                            <li>Incident response procedures and breach notification protocols</li>
                        </ul>
                        <p class="text-gray-700 mt-4">
                            <strong>Important:</strong> While we implement reasonable safeguards, no system is
                            completely secure. We cannot guarantee absolute security of data transmitted over the
                            internet.
                        </p>
                    </div>

                    <!-- 11. Children's Privacy -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            11. Children's Privacy
                        </h2>
                        <p class="text-gray-700 mb-4">
                            Linkskool is not intended for children under 13 years of age without explicit parental or
                            guardian consent.
                        </p>
                        <p class="text-gray-700">
                            If we become aware that we have collected personal data from a child under 13 without
                            verified parental consent, we will take steps to delete that information promptly. Parents
                            or guardians who believe we have collected information from their child may contact us at <a
                                href="mailto:privacy@linkskool.com"
                                class="text-blue-600 hover:underline">privacy@linkskool.com</a>.
                        </p>
                    </div>

                    <!-- 12. Third-Party Links -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            12. Third-Party Links and Services
                        </h2>
                        <p class="text-gray-700 mb-4">
                            Our Service may contain links to third-party websites, services, or content not operated by
                            Linkskool.
                        </p>
                        <p class="text-gray-700">
                            We are not responsible for the privacy practices of third parties. We encourage you to
                            review the privacy policies of any third-party services you access through our platform.
                        </p>
                    </div>

                    <!-- 13. Changes to This Policy -->
                    <div class="mb-12">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-600">
                            13. Changes to This Privacy Policy
                        </h2>
                        <p class="text-gray-700 mb-4">
                            We may update this Privacy Policy from time to time to reflect changes in our practices,
                            legal requirements, or service features.
                        </p>
                        <p class="text-gray-700 mb-4">
                            When we make material changes, we will:
                        </p>
                        <ul class="space-y-2 text-gray-700 list-disc list-inside">
                            <li>Update the "Last updated" date at the top of this policy</li>
                            <li>Notify you via email or through a prominent notice in the Service</li>
                            <li>Request your renewed consent where required by law</li>
                        </ul>
                        <p class="text-gray-700 mt-4">
                            Your continued use of the Service after changes become effective constitutes acceptance of
                            the updated policy.
                        </p>
                    </div>

                    <!-- Contact Information -->
                    <div
                        class="mt-16 p-8 bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl border border-blue-200">
                        <h2 class="text-3xl font-bold text-gray-900 mb-6">
                            14. Contact Us
                        </h2>
                        <p class="text-gray-700 mb-6">
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                            practices, please contact us:
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

.prose a {
    color: #2563eb;
    text-decoration: none;
}

.prose a:hover {
    text-decoration: underline;
}
</style>
