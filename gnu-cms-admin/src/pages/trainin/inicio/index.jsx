import React from 'react'
import PageSectionsEditor from '../../../components/page-sections-editor'

export default function TraininInicio() {
  return (
    <PageSectionsEditor
      site="traninn-logistic"
      page="inicio"
      pageId={32}
      includeGlobals
      title="Landing Page — Trainin Logistic"
      backTo="/trainin/select-page"
    />
  )
}
