'use client';

import { useEffect, useState } from 'react';

import {
  supabase,
  type CompanySettings,
  type SocialLink,
} from '@/lib/supabase';

import {
  Save,
  Loader as Loader2,
  Building2,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

import ImageUploader from '@/components/admin/ImageUploader';
import WebsiteAppearanceSettings from '@/components/admin/WebsiteAppearanceSettings ';
import WebsiteVideoSettings from '@/components/admin/WebsiteVideoSettings';
/* =========================================================
   SOCIAL PLATFORM OPTIONS
========================================================= */

const SOCIAL_PLATFORMS = [
  {
    value: 'instagram',
    label: 'Instagram',
  },
  {
    value: 'facebook',
    label: 'Facebook',
  },
  {
    value: 'youtube',
    label: 'YouTube',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp',
  },
  {
    value: 'website',
    label: 'Website',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

/* =========================================================
   DEFAULT SOCIAL LINK
========================================================= */

const createEmptySocialLink = (
  companyId: string,
  displayOrder: number
): SocialLink => ({
  id: `new-${Date.now()}-${Math.random()}`,
  company_id: companyId,
  platform: 'instagram',
  label: '',
  url: '',
  qr_code_url: null,
  display_order: displayOrder,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/* =========================================================
   PLATFORM ICON
========================================================= */

function SocialIcon({
  platform,
}: {
  platform: string;
}) {
  const className = 'w-5 h-5';

  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;

    case 'facebook':
      return <Facebook className={className} />;

    case 'youtube':
      return <Youtube className={className} />;

    case 'linkedin':
      return <Linkedin className={className} />;

    case 'whatsapp':
      return <MessageCircle className={className} />;

    case 'website':
      return <Globe className={className} />;

    default:
      return <Globe className={className} />;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminSettings() {
  const [settings, setSettings] =
    useState<CompanySettings | null>(null);

  const [socialLinks, setSocialLinks] =
    useState<SocialLink[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        /* ---------------------------------------------
           COMPANY SETTINGS
        --------------------------------------------- */

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .single();

        if (companyError) {
          console.error(
            'Company Settings Error:',
            companyError
          );

          setErrorMessage(
            'Unable to load company settings.'
          );

          setLoading(false);
          return;
        }

        if (!companyData) {
          setErrorMessage(
            'Company settings not found.'
          );

          setLoading(false);
          return;
        }

        /* ---------------------------------------------
           NORMALIZE COMPANY DATA
        --------------------------------------------- */

        const companySettings: CompanySettings = {
          ...companyData,

          phone_numbers:
            Array.isArray(companyData.phone_numbers)
              ? companyData.phone_numbers
              : [],

          emails:
            Array.isArray(companyData.emails)
              ? companyData.emails
              : [],
        };

        setSettings(companySettings);

        /* ---------------------------------------------
           LOAD SOCIAL LINKS
        --------------------------------------------- */

        const {
          data: socialData,
          error: socialError,
        } = await supabase
          .from('social_links')
          .select('*')
          .eq(
            'company_id',
            companyData.id
          )
          .order('display_order', {
            ascending: true,
          });

        if (socialError) {
          console.error(
            'Social Links Error:',
            socialError
          );

          /*
           * Do not block company settings if
           * social_links table has an issue.
           */

          setSocialLinks([]);
        } else {
          setSocialLinks(
            Array.isArray(socialData)
              ? socialData
              : []
          );
        }
      } catch (error) {
        console.error(
          'Settings Load Error:',
          error
        );

        setErrorMessage(
          'Something went wrong while loading settings.'
        );
      }

      setLoading(false);
    };

    loadSettings();
  }, []);

  /* =========================================================
     UPDATE NORMAL FIELD
  ========================================================= */

  const update = <
    K extends Exclude<
      keyof CompanySettings,
      'phone_numbers' | 'emails' | 'social_links'
    >
  >(
    field: K,
    value: CompanySettings[K]
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: value,
    });
  };

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const updateImageUrl = (
    field:
      | 'logo_url'
      | 'signature_url'
      | 'qr_code_url',
    urls: string[]
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: urls[0] || null,
    });
  };

  /* =========================================================
     PHONE NUMBERS
  ========================================================= */

  const updatePhone = (
    index: number,
    value: string
  ) => {
    if (!settings) return;

    const phoneNumbers = [
      ...(settings.phone_numbers || []),
    ];

    phoneNumbers[index] = value;

    setSettings({
      ...settings,
      phone_numbers: phoneNumbers,
    });
  };

  const addPhone = () => {
    if (!settings) return;

    setSettings({
      ...settings,

      phone_numbers: [
        ...(settings.phone_numbers || []),
        '',
      ],
    });
  };

  const removePhone = (
    index: number
  ) => {
    if (!settings) return;

    const phoneNumbers = [
      ...(settings.phone_numbers || []),
    ];

    phoneNumbers.splice(index, 1);

    setSettings({
      ...settings,
      phone_numbers: phoneNumbers,
    });
  };

  /* =========================================================
     EMAILS
  ========================================================= */

  const updateEmail = (
    index: number,
    value: string
  ) => {
    if (!settings) return;

    const emails = [
      ...(settings.emails || []),
    ];

    emails[index] = value;

    setSettings({
      ...settings,
      emails,
    });
  };

  const addEmail = () => {
    if (!settings) return;

    setSettings({
      ...settings,

      emails: [
        ...(settings.emails || []),
        '',
      ],
    });
  };

  const removeEmail = (
    index: number
  ) => {
    if (!settings) return;

    const emails = [
      ...(settings.emails || []),
    ];

    emails.splice(index, 1);

    setSettings({
      ...settings,
      emails,
    });
  };

  /* =========================================================
     SOCIAL LINKS
  ========================================================= */

  const addSocialLink = () => {
    if (!settings) return;

    const newSocial = createEmptySocialLink(
      settings.id,
      socialLinks.length
    );

    setSocialLinks([
      ...socialLinks,
      newSocial,
    ]);
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: unknown
  ) => {
    const updated = [
      ...socialLinks,
    ];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setSocialLinks(updated);
  };

  const removeSocialLink = (
    index: number
  ) => {
    const updated = [
      ...socialLinks,
    ];

    updated.splice(index, 1);

    /*
     * Recalculate display order.
     */

    const reordered = updated.map(
      (item, itemIndex) => ({
        ...item,
        display_order: itemIndex,
      })
    );

    setSocialLinks(reordered);
  };

  /* =========================================================
     MOVE SOCIAL LINK UP
  ========================================================= */

  const moveSocialUp = (
    index: number
  ) => {
    if (index === 0) return;

    const updated = [
      ...socialLinks,
    ];

    const temp = updated[index];

    updated[index] =
      updated[index - 1];

    updated[index - 1] = temp;

    setSocialLinks(
      updated.map(
        (item, itemIndex) => ({
          ...item,
          display_order: itemIndex,
        })
      )
    );
  };

  /* =========================================================
     MOVE SOCIAL LINK DOWN
  ========================================================= */

  const moveSocialDown = (
    index: number
  ) => {
    if (
      index ===
      socialLinks.length - 1
    ) {
      return;
    }

    const updated = [
      ...socialLinks,
    ];

    const temp = updated[index];

    updated[index] =
      updated[index + 1];

    updated[index + 1] = temp;

    setSocialLinks(
      updated.map(
        (item, itemIndex) => ({
          ...item,
          display_order: itemIndex,
        })
      )
    );
  };

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaved(false);
    setErrorMessage('');

    try {
      /* ---------------------------------------------
         CLEAN PHONE NUMBERS
      --------------------------------------------- */

      const phoneNumbers = (
        settings.phone_numbers || []
      )
        .map((phone) =>
          phone.trim()
        )
        .filter(Boolean);

      /* ---------------------------------------------
         CLEAN EMAILS
      --------------------------------------------- */

      const emails = (
        settings.emails || []
      )
        .map((email) =>
          email.trim()
        )
        .filter(Boolean);

      /* ---------------------------------------------
         UPDATE COMPANY SETTINGS
      --------------------------------------------- */

      const {
        data: companyData,
        error: companyError,
      } = await supabase
        .from('company_settings')
        .update({
          company_name:
            settings.company_name,

          tagline:
            settings.tagline,

          address:
            settings.address,

          phone_numbers:
            phoneNumbers,

          emails:
            emails,

          gstin:
            settings.gstin,

          pan:
            settings.pan,

          bank_name:
            settings.bank_name,

          account_number:
            settings.account_number,

          ifsc_code:
            settings.ifsc_code,

          branch:
            settings.branch,

          upi_id:
            settings.upi_id,

          logo_url:
            settings.logo_url,

          signature_url:
            settings.signature_url,

          qr_code_url:
            settings.qr_code_url,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (companyError) {
        console.error(
          'Company Save Error:',
          companyError
        );

        throw new Error(
          companyError.message
        );
      }

      console.log(
        'Updated Company Settings:',
        companyData
      );

      /* ---------------------------------------------
         CLEAN SOCIAL LINKS
      --------------------------------------------- */

      const cleanedSocialLinks =
        socialLinks
          .map((social, index) => ({
            ...social,

            platform:
              social.platform.trim(),

            label:
              social.label?.trim() || null,

            url:
              social.url.trim(),

            display_order:
              index,

            is_active:
              Boolean(
                social.is_active
              ),
          }))
          .filter(
            (social) =>
              social.url &&
              social.platform
          );

      /* ---------------------------------------------
         DELETE EXISTING SOCIAL LINKS
         
         We replace the company's social links
         with the current admin-panel state.
      --------------------------------------------- */

      const {
        error: deleteSocialError,
      } = await supabase
        .from('social_links')
        .delete()
        .eq(
          'company_id',
          settings.id
        );

      if (deleteSocialError) {
        console.error(
          'Delete Social Links Error:',
          deleteSocialError
        );

        throw new Error(
          deleteSocialError.message
        );
      }

      /* ---------------------------------------------
         INSERT SOCIAL LINKS
      --------------------------------------------- */

      if (
        cleanedSocialLinks.length >
        0
      ) {
        const socialRows =
          cleanedSocialLinks.map(
            (social, index) => ({
              company_id:
                settings.id,

              platform:
                social.platform,

              label:
                social.label,

              url:
                social.url,

              /*
               * QR is generated dynamically
               * from the URL.
               *
               * We intentionally do not store
               * generated QR images here.
               */

              qr_code_url:
                social.qr_code_url || null,

              display_order:
                index,

              is_active:
                social.is_active,

              updated_at:
                new Date().toISOString(),
            })
          );

        const {
          data: insertedSocialLinks,
          error: insertSocialError,
        } = await supabase
          .from('social_links')
          .insert(socialRows)
          .select();

        if (insertSocialError) {
          console.error(
            'Insert Social Links Error:',
            insertSocialError
          );

          throw new Error(
            insertSocialError.message
          );
        }

        setSocialLinks(
          insertedSocialLinks || []
        );
      } else {
        setSocialLinks([]);
      }

      /* ---------------------------------------------
         UPDATE LOCAL COMPANY STATE
      --------------------------------------------- */

      setSettings({
        ...settings,

        phone_numbers:
          phoneNumbers,

        emails:
          emails,
      });

      setSaving(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error(
        'Save Settings Error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? `Failed to save settings: ${error.message}`
          : 'Failed to save settings.'
      );

      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="p-8">

        <div className="h-8 bg-green-100 rounded-xl w-64 mb-6 animate-pulse" />

        <div className="space-y-4">

          {[1, 2, 3, 4].map(
            (i) => (
              <div
                key={i}
                className="h-20 bg-green-50 rounded-2xl animate-pulse"
              />
            )
          )}

        </div>

      </div>
    );
  }

  /* =========================================================
     NO SETTINGS
  ========================================================= */

  if (!settings) {
    return (
      <div className="p-8">

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">

          <h2 className="font-bold text-red-800">
            Company Settings Not Found
          </h2>

          <p className="text-sm text-red-600 mt-2">
            Please create a record in the
            company_settings table first.
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     STYLES
  ========================================================= */

  const inputClass =
    'w-full mt-1.5 px-3 py-2.5 text-sm border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400';

  const labelClass =
    'text-xs font-medium text-green-600 uppercase tracking-wide';

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="p-6 md:p-8 max-w-4xl">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex items-center gap-3 mb-8">

        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">

          <Building2 className="w-5 h-5 text-green-700" />

        </div>

        <div>

          <h1 className="font-display text-3xl font-bold text-green-900">
            Company Settings
          </h1>

          <p className="text-green-600 text-sm mt-1">
            Configure your business details for invoices
          </p>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          COMPANY INFORMATION
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <h2 className="font-display text-lg font-bold text-green-900 mb-4">
          Company Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* COMPANY NAME */}

          <div className="sm:col-span-2">

            <label className={labelClass}>
              Company Name
            </label>

            <input
              className={inputClass}
              value={
                settings.company_name ||
                ''
              }
              onChange={(e) =>
                update(
                  'company_name',
                  e.target.value
                )
              }
              placeholder="B M N Enterprises"
            />

          </div>

          {/* TAGLINE */}

          <div className="sm:col-span-2">

            <label className={labelClass}>
              Tagline
            </label>

            <input
              className={inputClass}
              value={
                settings.tagline ||
                ''
              }
              onChange={(e) =>
                update(
                  'tagline',
                  e.target.value
                )
              }
              placeholder="GST Invoice"
            />

          </div>

          {/* ADDRESS */}

          <div className="sm:col-span-2">

            <label className={labelClass}>
              Company Address
            </label>

            <textarea
              className={inputClass}
              rows={3}
              value={
                settings.address ||
                ''
              }
              onChange={(e) =>
                update(
                  'address',
                  e.target.value
                )
              }
              placeholder="Enter complete company address"
            />

            <p className="text-xs text-gray-400 mt-1.5">
              This is the only company address used on the invoice.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          PHONE NUMBERS
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <div className="flex items-start justify-between gap-4 mb-5">

          <div>

            <h2 className="font-display text-lg font-bold text-green-900">
              Phone Numbers
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Add multiple business contact numbers.
            </p>

          </div>

          <button
            type="button"
            onClick={addPhone}
            className="shrink-0 flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors"
          >

            <Plus className="w-4 h-4" />

            Add Number

          </button>

        </div>

        <div className="space-y-3">

          {settings.phone_numbers.map(
            (phone, index) => (

              <div
                key={`phone-${index}`}
                className="flex items-center gap-2"
              >

                <div className="flex-1">

                  <input
                    type="tel"
                    className={inputClass}
                    value={phone}
                    onChange={(e) =>
                      updatePhone(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="+91 98765 43210"
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removePhone(index)
                  }
                  className="mt-1.5 shrink-0 w-11 h-[43px] flex items-center justify-center border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  aria-label="Remove phone number"
                  title="Remove phone number"
                >

                  <Trash2 className="w-4 h-4" />

                </button>

              </div>

            )
          )}

          {settings.phone_numbers.length ===
            0 && (

            <div className="border border-dashed border-green-200 rounded-xl p-5 text-center">

              <p className="text-sm text-gray-400">
                No phone numbers added.
              </p>

              <button
                type="button"
                onClick={addPhone}
                className="text-sm text-green-700 font-medium mt-2 hover:underline"
              >
                + Add your first number
              </button>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          EMAIL ADDRESSES
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <div className="flex items-start justify-between gap-4 mb-5">

          <div>

            <h2 className="font-display text-lg font-bold text-green-900">
              Email Addresses
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Add multiple business email addresses.
            </p>

          </div>

          <button
            type="button"
            onClick={addEmail}
            className="shrink-0 flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors"
          >

            <Plus className="w-4 h-4" />

            Add Email

          </button>

        </div>

        <div className="space-y-3">

          {settings.emails.map(
            (email, index) => (

              <div
                key={`email-${index}`}
                className="flex items-center gap-2"
              >

                <div className="flex-1">

                  <input
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) =>
                      updateEmail(
                        index,
                        e.target.value
                      )
                    }
                    placeholder="sales@company.com"
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeEmail(index)
                  }
                  className="mt-1.5 shrink-0 w-11 h-[43px] flex items-center justify-center border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  aria-label="Remove email"
                  title="Remove email"
                >

                  <Trash2 className="w-4 h-4" />

                </button>

              </div>

            )
          )}

          {settings.emails.length ===
            0 && (

            <div className="border border-dashed border-green-200 rounded-xl p-5 text-center">

              <p className="text-sm text-gray-400">
                No email addresses added.
              </p>

              <button
                type="button"
                onClick={addEmail}
                className="text-sm text-green-700 font-medium mt-2 hover:underline"
              >
                + Add your first email
              </button>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          SOCIAL MEDIA
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <div className="flex items-start justify-between gap-4 mb-5">

          <div>

            <h2 className="font-display text-lg font-bold text-green-900">
              Social Media & Online Links
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Add your social media accounts. QR codes can be
              generated automatically from these links.
            </p>

          </div>

          <button
            type="button"
            onClick={addSocialLink}
            className="shrink-0 flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors"
          >

            <Plus className="w-4 h-4" />

            Add Social

          </button>

        </div>

        {socialLinks.length === 0 ? (

          <div className="border border-dashed border-green-200 rounded-2xl p-8 text-center">

            <div className="mx-auto w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">

              <Globe className="w-6 h-6" />

            </div>

            <p className="text-sm text-gray-500">
              No social media accounts added.
            </p>

            <button
              type="button"
              onClick={addSocialLink}
              className="text-sm text-green-700 font-medium mt-2 hover:underline"
            >
              + Add your first social account
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {socialLinks.map(
              (social, index) => (

                <div
                  key={social.id}
                  className="border border-green-100 rounded-2xl p-4 bg-green-50/30"
                >

                  {/* TOP */}

                  <div className="flex items-center justify-between gap-3 mb-4">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">

                        <SocialIcon
                          platform={
                            social.platform
                          }
                        />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-green-900">
                          {social.label ||
                            SOCIAL_PLATFORMS.find(
                              (item) =>
                                item.value ===
                                social.platform
                            )?.label ||
                            'Social Account'}
                        </p>

                        <p className="text-xs text-gray-400">
                          Position {index + 1}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      {/* UP */}

                      <button
                        type="button"
                        onClick={() =>
                          moveSocialUp(
                            index
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="px-2.5 py-1.5 text-xs border border-green-200 rounded-lg text-green-700 disabled:opacity-30"
                        title="Move up"
                      >
                        ↑
                      </button>

                      {/* DOWN */}

                      <button
                        type="button"
                        onClick={() =>
                          moveSocialDown(
                            index
                          )
                        }
                        disabled={
                          index ===
                          socialLinks.length -
                            1
                        }
                        className="px-2.5 py-1.5 text-xs border border-green-200 rounded-lg text-green-700 disabled:opacity-30"
                        title="Move down"
                      >
                        ↓
                      </button>

                      {/* ACTIVE */}

                      <button
                        type="button"
                        onClick={() =>
                          updateSocialLink(
                            index,
                            'is_active',
                            !social.is_active
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          social.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {social.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeSocialLink(
                            index
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                        title="Remove social account"
                      >

                        <Trash2 className="w-4 h-4" />

                      </button>

                    </div>

                  </div>

                  {/* FIELDS */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* PLATFORM */}

                    <div>

                      <label
                        className={
                          labelClass
                        }
                      >
                        Platform
                      </label>

                      <select
                        className={
                          inputClass
                        }
                        value={
                          social.platform
                        }
                        onChange={(e) =>
                          updateSocialLink(
                            index,
                            'platform',
                            e.target.value
                          )
                        }
                      >

                        {SOCIAL_PLATFORMS.map(
                          (platform) => (

                            <option
                              key={
                                platform.value
                              }
                              value={
                                platform.value
                              }
                            >
                              {
                                platform.label
                              }
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    {/* LABEL */}

                    <div>

                      <label
                        className={
                          labelClass
                        }
                      >
                        Display Label
                      </label>

                      <input
                        className={
                          inputClass
                        }
                        value={
                          social.label ||
                          ''
                        }
                        onChange={(e) =>
                          updateSocialLink(
                            index,
                            'label',
                            e.target.value
                          )
                        }
                        placeholder="Follow us on Instagram"
                      />

                    </div>

                    {/* URL */}

                    <div className="md:col-span-2">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Social Media URL
                      </label>

                      <div className="flex gap-2">

                        <div className="relative flex-1">

                          <input
                            type="url"
                            className={
                              inputClass
                            }
                            value={
                              social.url
                            }
                            onChange={(e) =>
                              updateSocialLink(
                                index,
                                'url',
                                e.target.value
                              )
                            }
                            placeholder="https://instagram.com/yourbusiness"
                          />

                        </div>

                        {social.url && (
                          <a
                            href={
                              social.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 w-11 h-[43px] shrink-0 flex items-center justify-center border border-green-200 text-green-700 rounded-xl hover:bg-green-50"
                            title="Open link"
                          >

                            <ExternalLink className="w-4 h-4" />

                          </a>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* QR INFO */}

                  <div className="mt-4 p-3 rounded-xl bg-white border border-green-100">

                    <div className="flex items-start gap-3">

                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">

                        <Globe className="w-4 h-4" />

                      </div>

                      <div>

                        <p className="text-xs font-semibold text-green-800">
                          QR Code
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          A QR code can be generated
                          automatically from this URL
                          when displaying the invoice.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          COMPANY BRANDING
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <h2 className="font-display text-lg font-bold text-green-900 mb-4">
          Company Branding
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* LOGO */}

          <ImageUploader
            value={
              settings.logo_url
                ? [settings.logo_url]
                : []
            }
            onChange={(urls) =>
              updateImageUrl(
                'logo_url',
                urls
              )
            }
            folder="company"
            max={1}
            label="Company Logo"
            bucket="companyassets"
          />

          {/* SIGNATURE */}

          <ImageUploader
            value={
              settings.signature_url
                ? [settings.signature_url]
                : []
            }
            onChange={(urls) =>
              updateImageUrl(
                'signature_url',
                urls
              )
            }
            folder="company"
            max={1}
            label="Digital Signature"
            bucket="companyassets"
          />

          {/* QR */}

          <div className="sm:col-span-2">

            <ImageUploader
              value={
                settings.qr_code_url
                  ? [settings.qr_code_url]
                  : []
              }
              onChange={(urls) =>
                updateImageUrl(
                  'qr_code_url',
                  urls
                )
              }
              folder="company"
              max={1}
              label="QR Code (Optional)"
              bucket="companyassets"
            />

            <p className="text-xs text-gray-400 mt-2">
              This is your existing general/company QR.
              Social media QR codes are generated from
              the social URLs separately.
            </p>

          </div>

        </div>

      </div>
              <WebsiteAppearanceSettings />
              <WebsiteVideoSettings />
      {/* =====================================================
          TAX INFORMATION
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <h2 className="font-display text-lg font-bold text-green-900 mb-4">
          Tax Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* GSTIN */}

          <div>

            <label className={labelClass}>
              GSTIN
            </label>

            <input
              className={`${inputClass} uppercase`}
              value={
                settings.gstin ||
                ''
              }
              onChange={(e) =>
                update(
                  'gstin',
                  e.target.value.toUpperCase()
                )
              }
              placeholder="07ABCDE1234F1Z5"
              maxLength={15}
            />

          </div>

          {/* PAN */}

          <div>

            <label className={labelClass}>
              PAN
            </label>

            <input
              className={`${inputClass} uppercase`}
              value={
                settings.pan ||
                ''
              }
              onChange={(e) =>
                update(
                  'pan',
                  e.target.value.toUpperCase()
                )
              }
              placeholder="ABCDE1234F"
              maxLength={10}
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          BANK DETAILS
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-green-100 p-6 mb-6">

        <h2 className="font-display text-lg font-bold text-green-900 mb-4">
          Bank Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* BANK */}

          <div>

            <label className={labelClass}>
              Bank Name
            </label>

            <input
              className={inputClass}
              value={
                settings.bank_name ||
                ''
              }
              onChange={(e) =>
                update(
                  'bank_name',
                  e.target.value
                )
              }
              placeholder="Yes Bank"
            />

          </div>

          {/* ACCOUNT */}

          <div>

            <label className={labelClass}>
              Account Number
            </label>

            <input
              className={inputClass}
              value={
                settings.account_number ||
                ''
              }
              onChange={(e) =>
                update(
                  'account_number',
                  e.target.value
                )
              }
              placeholder="Account Number"
            />

          </div>

          {/* IFSC */}

          <div>

            <label className={labelClass}>
              IFSC Code
            </label>

            <input
              className={`${inputClass} uppercase`}
              value={
                settings.ifsc_code ||
                ''
              }
              onChange={(e) =>
                update(
                  'ifsc_code',
                  e.target.value.toUpperCase()
                )
              }
              placeholder="YESB0000000"
            />

          </div>

          {/* BRANCH */}

          <div>

            <label className={labelClass}>
              Branch
            </label>

            <input
              className={inputClass}
              value={
                settings.branch ||
                ''
              }
              onChange={(e) =>
                update(
                  'branch',
                  e.target.value
                )
              }
              placeholder="Branch Name"
            />

          </div>

          {/* UPI */}

          <div className="sm:col-span-2">

            <label className={labelClass}>
              UPI ID
            </label>

            <input
              className={inputClass}
              value={
                settings.upi_id ||
                ''
              }
              onChange={(e) =>
                update(
                  'upi_id',
                  e.target.value
                )
              }
              placeholder="bharatadvance@upi"
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          SAVE BUTTON
      ===================================================== */}

      <div className="flex items-center gap-4 pb-10">

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-800 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >

          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}

          {saving
            ? 'Saving...'
            : 'Save Settings'}

        </button>

        {saved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Settings saved successfully!
          </span>
        )}

      </div>

    </div>
  );
}