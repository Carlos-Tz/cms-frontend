import React from 'react'
import PageSectionsEditor from '../../../components/page-sections-editor'

export default function TectuusInicio() {
  return (
    <PageSectionsEditor
      site="tectuus"
      page="inicio"
      includeGlobals
      title="Landing Page — Tectuus"
      backTo="/tectuus/select-page"
    />
  )
}
