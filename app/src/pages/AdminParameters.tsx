import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '@/components'
import { api } from '@/services/api'
import { useToast } from '@/hooks'
import './AdminParameters.css'

interface Parameter {
  id: string
  key: string
  value: any
  version: number
  description: string
  isActive: boolean
  createdAt: string
}

export const AdminParameters: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  const [parameters, setParameters] = useState<Parameter[]>([])
  const [selectedParam, setSelectedParam] = useState<string | null>(null)
  const [versions, setVersions] = useState<Parameter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadParameters()
  }, [])

  const getCategory = (key: string): string => {
    if (key.startsWith('prompts.')) return 'prompts'
    if (key.startsWith('alter.')) return 'alter'
    if (key.startsWith('matching.')) return 'matching'
    if (key.startsWith('chat.')) return 'chat'
    if (key.startsWith('upload.')) return 'upload'
    if (key.startsWith('llm.')) return 'llm'
    if (key.startsWith('email.')) return 'email'
    if (key.startsWith('security.')) return 'security'
    if (key.startsWith('app.')) return 'app'
    return 'other'
  }

  const filteredParameters = filterCategory === 'all'
    ? parameters
    : parameters.filter(p => getCategory(p.key) === filterCategory)

  const loadParameters = async () => {
    try {
      setIsLoading(true)
      const data = await api.get<Parameter[]>('/parameters')
      setParameters(data)
    } catch (err) {
      showError('Erreur lors du chargement des paramètres')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersions = async (key: string) => {
    try {
      const data = await api.get<Parameter[]>(`/parameters/${key}/versions`)
      setVersions(data)
      setSelectedParam(key)
    } catch (err) {
      showError('Erreur lors du chargement de l\'historique')
    }
  }

  const handleEdit = (param: Parameter) => {
    setEditingKey(param.key)
    // Si c'est une string, ne pas la stringifier (pour éviter d'échapper les \n)
    const valueToEdit = typeof param.value === 'string'
      ? param.value
      : JSON.stringify(param.value, null, 2)
    setEditValue(valueToEdit)
    setEditDescription(param.description || '')
  }

  const handleSave = async () => {
    if (!editingKey) return

    try {
      let parsedValue
      try {
        parsedValue = JSON.parse(editValue)
      } catch {
        parsedValue = editValue
      }

      await api.put(`/parameters/${editingKey}`, {
        value: parsedValue,
        description: editDescription,
      })

      showSuccess('Paramètre mis à jour avec succès')
      setEditingKey(null)
      setEditValue('')
      setEditDescription('')
      await loadParameters()
      if (selectedParam === editingKey) {
        await loadVersions(editingKey)
      }
    } catch (err) {
      showError('Erreur lors de la mise à jour')
    }
  }

  const handleRestore = async (key: string, version: number) => {
    try {
      await api.put(`/parameters/${key}/versions/${version}/restore`)
      showSuccess(`Version ${version} restaurée`)
      await loadParameters()
      await loadVersions(key)
    } catch (err) {
      showError('Erreur lors de la restauration')
    }
  }

  const handleDelete = async (key: string, version: number) => {
    if (!confirm(`Supprimer définitivement la version ${version} ?`)) return

    try {
      await api.delete(`/parameters/${key}/versions/${version}`)
      showSuccess('Version supprimée')
      await loadVersions(key)
    } catch (err) {
      showError('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="admin-parameters-container">
        <div className="admin-parameters-loading">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="admin-parameters-container">
      <div className="admin-parameters-content">
        <div className="admin-parameters-header">
          <button className="admin-parameters-back" onClick={() => navigate('/profile')}>
            ← Retour au profil
          </button>
          <h1 className="admin-parameters-title">⚙️ Paramètres système</h1>
          <p className="admin-parameters-subtitle">
            Gestion centralisée des paramètres avec versioning, historique et cache
          </p>

          {/* Filtres par catégorie */}
          <div className="admin-parameters-filters">
            {[
              { key: 'all', label: 'Tous', icon: '📋', count: parameters.length },
              { key: 'prompts', label: 'Prompts IA', icon: '🤖', count: parameters.filter(p => getCategory(p.key) === 'prompts').length },
              { key: 'alter', label: 'Alter', icon: '💬', count: parameters.filter(p => getCategory(p.key) === 'alter').length },
              { key: 'matching', label: 'Matching', icon: '❤️', count: parameters.filter(p => getCategory(p.key) === 'matching').length },
              { key: 'app', label: 'Application', icon: '📱', count: parameters.filter(p => getCategory(p.key) === 'app').length },
            ].map(cat => (
              <button
                key={cat.key}
                className={`admin-parameters-filter ${filterCategory === cat.key ? 'admin-parameters-filter--active' : ''}`}
                onClick={() => setFilterCategory(cat.key)}
              >
                <span className="admin-parameters-filter-icon">{cat.icon}</span>
                <span className="admin-parameters-filter-label">{cat.label}</span>
                <span className="admin-parameters-filter-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-parameters-grid">
          {/* Liste des paramètres */}
          <div className="admin-parameters-list-wrapper">
            <div className="admin-parameters-list">
              <h2 className="admin-parameters-section-title">
                {filterCategory === 'all' ? 'Tous les paramètres' :
                 filterCategory === 'prompts' ? '🤖 Prompts IA' :
                 filterCategory === 'alter' ? '💬 Configuration Alter' :
                 filterCategory === 'matching' ? '❤️ Matching' :
                 '📱 Application'}
                <span className="admin-parameters-count">{filteredParameters.length}</span>
              </h2>
              <div className="admin-parameters-list-content">
                {filteredParameters.map(param => {
                  const isPrompt = getCategory(param.key) === 'prompts'
                  return (
                    <Card
                      key={param.id}
                      className={`admin-parameter-card ${isPrompt ? 'admin-parameter-card--prompt' : ''}`}
                    >
                      <div className="admin-parameter-header">
                        <div className="admin-parameter-header-left">
                          {isPrompt && <span className="admin-parameter-prompt-badge">🤖 Prompt</span>}
                          <h3 className="admin-parameter-key">{param.key}</h3>
                          {param.description && (
                            <p className="admin-parameter-description">{param.description}</p>
                          )}
                        </div>
                        <span className="admin-parameter-version">v{param.version}</span>
                      </div>

                      <div className="admin-parameter-value">
                        <code>{typeof param.value === 'string'
                          ? (param.value.length > 200 ? param.value.substring(0, 200) + '...' : param.value)
                          : JSON.stringify(param.value, null, 2)}
                        </code>
                      </div>

                      <div className="admin-parameter-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(param)}
                        >
                          ✏️ Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadVersions(param.key)}
                        >
                          📜 Historique
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panneau d'édition ou historique */}
          <div className="admin-parameters-sidebar">
            {editingKey ? (
              <div className="admin-parameter-edit-wrapper">
                <Card className="admin-parameter-edit">
                  <div className="admin-parameter-edit-header">
                    <h2 className="admin-parameters-section-title">Modifier : {editingKey}</h2>
                  </div>

                  <div className="admin-parameter-edit-content">
                    <div className="admin-parameter-form">
                      <label className="admin-parameter-label">
                        Description
                        <input
                          type="text"
                          className="admin-parameter-input"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          placeholder={t('common.parameterDescription')}
                        />
                      </label>

                      <label className="admin-parameter-label">
                        Valeur (JSON)
                        <textarea
                          className="admin-parameter-textarea"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          rows={15}
                        />
                      </label>

                      <div className="admin-parameter-edit-actions">
                        <Button onClick={handleSave}>
                          Enregistrer (nouvelle version)
                        </Button>
                        <Button variant="outline" onClick={() => setEditingKey(null)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : selectedParam ? (
              <div className="admin-parameter-history-wrapper">
                <Card className="admin-parameter-history">
                  <div className="admin-parameter-history-header">
                    <h2 className="admin-parameters-section-title">
                      Historique : {selectedParam}
                    </h2>
                  </div>

                  <div className="admin-parameter-history-content">
                    <div className="admin-parameter-versions">
                      {versions.map(version => (
                        <div
                          key={version.id}
                          className={`admin-parameter-version-card ${version.isActive ? 'admin-parameter-version-card--active' : ''}`}
                        >
                          <div className="admin-parameter-version-header">
                            <span className="admin-parameter-version-number">
                              Version {version.version}
                            </span>
                            {version.isActive && (
                              <span className="admin-parameter-version-badge">Active</span>
                            )}
                          </div>

                          <div className="admin-parameter-version-date">
                            {new Date(version.createdAt).toLocaleString('fr-FR')}
                          </div>

                          {version.description && (
                            <div className="admin-parameter-version-description">
                              {version.description}
                            </div>
                          )}

                          <div className="admin-parameter-version-value">
                            <code>{typeof version.value === 'string'
                              ? version.value
                              : JSON.stringify(version.value, null, 2)}
                            </code>
                          </div>

                          <div className="admin-parameter-version-actions">
                            {!version.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(selectedParam, version.version)}
                              >
                                Restaurer
                              </Button>
                            )}
                            {!version.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(selectedParam, version.version)}
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="admin-parameter-empty">
                <p>Sélectionnez un paramètre pour voir son historique</p>
                <p>ou cliquez sur Modifier pour éditer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
