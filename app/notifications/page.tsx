"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Settings, Zap, FileText, Send, List, Info, Users, Building2, CheckSquare, Plus, Edit, Trash2, Smartphone, MessageSquare, Globe } from 'lucide-react';
import { apiService } from '../services/api';
import NotificationConfigPanel from '../components/NotificationConfigPanel';
import NotificationTemplates from '../components/NotificationTemplates';
import { AppLayout } from '../components/AppLayout';

type TabKey = 'config' | 'triggers' | 'templates' | 'configuration' | 'test' | 'logs'

interface Connection {
  id: string;
  name: string;
  baseUrl: string;
  token: string;
  testMode: boolean;
  createdAt: string;
}

interface Trigger {
  id: string;
  name: string;
  eventType: string;
  connectionId: string;
  action: {
    type: string;
    to?: string;
    groupIds?: string[];
    communityId?: string;
    textTemplate?: string;
    messageTemplate?: string;
  };
  filters?: {
    method?: string;
    tableName?: string;
    pathContains?: string;
  };
  namespaceTags?: string[];
  active: boolean;
  createdAt: string;
}

interface Log {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
  eventType?: string;
  triggerId?: string;
  namespaceTags?: string[];
}

const NotificationsPage = () => {
  const [active, setActive] = useState<TabKey>('triggers')
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in')
  const [saving, setSaving] = useState(false)

  // Config form
  const [connName, setConnName] = useState('default')
  const [connToken, setConnToken] = useState('')
  const [connBaseUrl, setConnBaseUrl] = useState('https://gate.whapi.cloud')
  const [connTestMode, setConnTestMode] = useState(true)
  const [connections, setConnections] = useState<Connection[]>([])

  // Trigger form
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [trigName, setTrigName] = useState('')
  const [trigEvent, setTrigEvent] = useState('task_created')
  const [trigTo, setTrigTo] = useState('')
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [contactMode, setContactMode] = useState<'manual' | 'contact'>('manual')
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [trigTemplate, setTrigTemplate] = useState("")
  const [trigConnectionId, setTrigConnectionId] = useState<string>('')
  const [filterMethod, setFilterMethod] = useState<string>('')
  const [filterTableName, setFilterTableName] = useState<string>('')
  const [filterPathContains, setFilterPathContains] = useState<string>('')
  
  // Namespace tags
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])
  const [availableNamespaces, setAvailableNamespaces] = useState<any[]>([])
  const [loadingNamespaces, setLoadingNamespaces] = useState(false)
  const [customTag, setCustomTag] = useState<string>('')
  
  // New trigger types
  const [triggerType, setTriggerType] = useState<'users' | 'community' | 'group'>('users')
  const [communities, setCommunities] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [subgroups, setSubgroups] = useState<any[]>([])
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingSubgroups, setLoadingSubgroups] = useState(false)

  // Logs
  const [logs, setLogs] = useState<Log[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logNamespaceFilter, setLogNamespaceFilter] = useState<string>('')

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simple local persistence for selected tab
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('notif.activeTab') as TabKey | null : null
    if (saved) setActive(saved)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('notif.activeTab', active)
  }, [active])

  async function fetchConnections() {
    try {
      const res = await fetch(`${apiBase}/notify/connections`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setConnections(data.items)
      if (data?.items?.[0]?.id) setTrigConnectionId(data.items[0].id)
    } catch {}
  }

  async function fetchTriggers() {
    try {
      const res = await fetch(`${apiBase}/notify/triggers`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setTriggers(data.items)
    } catch {}
  }

  async function fetchLogs(namespaceFilter?: string) {
    setLoadingLogs(true)
    try {
      const url = namespaceFilter 
        ? `${apiBase}/notify/logs?namespace=${encodeURIComponent(namespaceFilter)}`
        : `${apiBase}/notify/logs`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setLogs(data.items)
    } catch {}
    setLoadingLogs(false)
  }

  async function fetchCommunities(connectionId: string) {
    if (!connectionId) return
    setLoadingCommunities(true)
    try {
      const res = await fetch(`${apiBase}/notify/communities/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let communities = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        if (responseData.announceGroupInfo) {
          communities.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          communities.push(...responseData.otherGroups)
        }
        
        if (communities.length === 0) {
          if (responseData.communities && Array.isArray(responseData.communities)) {
            communities = responseData.communities
          } else if (Array.isArray(responseData)) {
            communities = responseData
          }
        }
      }
      
      setCommunities(Array.isArray(communities) ? communities : [])
    } catch (e) {
      console.error('Failed to fetch communities:', e)
    }
    setLoadingCommunities(false)
  }

  async function fetchGroups(connectionId: string) {
    if (!connectionId) return
    setLoadingGroups(true)
    try {
      const res = await fetch(`${apiBase}/notify/groups/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let groups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        if (responseData.announceGroupInfo) {
          groups.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          groups.push(...responseData.otherGroups)
        }
        
        if (groups.length === 0) {
          if (responseData.groups && Array.isArray(responseData.groups)) {
            groups = responseData.groups
          } else if (Array.isArray(responseData)) {
            groups = responseData
          }
        }
      }
      
      setGroups(Array.isArray(groups) ? groups : [])
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    }
    setLoadingGroups(false)
  }

  async function fetchSubgroups(connectionId: string, communityId: string) {
    if (!connectionId || !communityId) return
    setLoadingSubgroups(true)
    try {
      const res = await fetch(`${apiBase}/notify/communities/${connectionId}/${communityId}/subgroups`, { cache: 'no-store' })
      const data = await res.json()
      
      let subgroups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        if (responseData.announceGroupInfo) {
          subgroups.push({
            ...responseData.announceGroupInfo,
            type: 'announcement'
          })
        }
        
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          subgroups.push(...responseData.otherGroups.map((group: any) => ({
            ...group,
            type: 'subgroup'
          })))
        }
        
        if (subgroups.length === 0) {
          if (responseData.subgroups && Array.isArray(responseData.subgroups)) {
            subgroups = responseData.subgroups.map((group: any) => ({
              ...group,
              type: 'subgroup'
            }))
          } else if (Array.isArray(responseData)) {
            subgroups = responseData.map((group: any) => ({
              ...group,
              type: 'subgroup'
            }))
          }
        }
        
        if (subgroups.length === 0 && responseData) {
          if (responseData.id && responseData.title) {
            subgroups = [{
              ...responseData,
              type: 'subgroup'
            }]
          }
        }
      }
      
      setSubgroups(Array.isArray(subgroups) ? subgroups : [])
    } catch (e) {
      console.error('Failed to fetch subgroups:', e)
    }
    setLoadingSubgroups(false)
  }

  async function testConnection(connectionId: string) {
    if (!connectionId) return
    try {
      const res = await fetch(`${apiBase}/notify/test/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.success) {
        alert('Connection test successful!')
      } else {
        alert('Connection test failed: ' + (data?.error || 'Unknown error'))
      }
    } catch (e) {
      alert('Connection test failed: ' + (e as Error).message)
    }
  }

  async function fetchContacts(connectionId: string) {
    if (!connectionId) return
    setLoadingContacts(true)
    try {
      const res = await fetch(`${apiBase}/notify/contacts/${connectionId}`, { cache: 'no-store' })
      const data = await res.json()
      
      let contactsList = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        if (responseData.contacts && Array.isArray(responseData.contacts)) {
          contactsList = responseData.contacts
        } else if (responseData.data && Array.isArray(responseData.data)) {
          contactsList = responseData.data
        } else if (Array.isArray(responseData)) {
          contactsList = responseData
        }
      }
      
      const validContacts = contactsList.filter((contact: any) => 
        contact && 
        contact.id && 
        contact.id !== '0' && 
        (contact.pushname || contact.name || contact.display_name)
      )
      
      setContacts(Array.isArray(validContacts) ? validContacts : [])
    } catch (e) {
      console.error('Failed to fetch contacts:', e)
    }
    setLoadingContacts(false)
  }

  async function fetchNamespaces() {
    setLoadingNamespaces(true)
    try {
      const res = await fetch(`${apiBase}/unified/namespaces`, { cache: 'no-store' })
      const data = await res.json()
      
      if (Array.isArray(data)) {
        const formattedNamespaces = data.map(ns => ({
          id: ns['namespace-id'],
          name: ns['namespace-name']
        }))
        setAvailableNamespaces(formattedNamespaces)
      } else {
        setAvailableNamespaces([])
      }
    } catch (e) {
      console.error('Failed to fetch namespaces:', e)
      setAvailableNamespaces([])
    }
    setLoadingNamespaces(false)
  }

  useEffect(() => {
    fetchConnections()
    fetchTriggers()
    fetchLogs()
    fetchNamespaces()
  }, [])

  // Fetch communities and groups when connection changes
  useEffect(() => {
    if (trigConnectionId) {
      if (triggerType === 'community') {
        fetchCommunities(trigConnectionId)
      } else if (triggerType === 'group') {
        fetchGroups(trigConnectionId)
      }
    }
  }, [trigConnectionId, triggerType])

  // Fetch subgroups when community changes
  useEffect(() => {
    if (trigConnectionId && selectedCommunity) {
      fetchSubgroups(trigConnectionId, selectedCommunity)
    }
  }, [trigConnectionId, selectedCommunity])

  // Update trigTo when country code changes
  useEffect(() => {
    if (contactMode === 'manual') {
      setTrigTo(countryCode + phoneNumber)
    }
  }, [countryCode, phoneNumber, contactMode])

  // Fetch contacts when connection changes and contact mode is selected
  useEffect(() => {
    if (trigConnectionId && contactMode === 'contact') {
      fetchContacts(trigConnectionId)
    }
  }, [trigConnectionId, contactMode])

  // Update trigTo when selected contact changes
  useEffect(() => {
    if (contactMode === 'contact' && selectedContact) {
      setTrigTo(selectedContact)
    }
  }, [selectedContact, contactMode])

  async function saveConnection() {
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/notify/connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: connName, token: connToken, baseUrl: connBaseUrl, testMode: connTestMode })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save connection')
      await fetchConnections()
      alert('Connection saved')
    } catch (e: any) {
      alert(e.message || 'Failed to save connection')
    }
    setSaving(false)
  }

  async function saveTrigger() {
    if (!trigConnectionId) return alert('Please select a connection')
    
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        if (!trigTo) return alert('Please enter recipient for users trigger')
        action = { 
          type: 'whapi_message', 
          to: trigTo, 
          textTemplate: trigTemplate 
        }
        break
      case 'community':
        if (!selectedCommunity) return alert('Please select a community')
        if (selectedGroups.length === 0) return alert('Please select at least one subgroup')
        action = { 
          type: 'whapi_community', 
          communityId: selectedCommunity,
          groupIds: selectedGroups,
          messageTemplate: trigTemplate 
        }
        break
      case 'group':
        if (selectedGroups.length === 0) return alert('Please select at least one group')
        action = { 
          type: 'whapi_group', 
          groupIds: selectedGroups,
          messageTemplate: trigTemplate 
        }
        break
    }
    
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/notify/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trigName,
          eventType: trigEvent,
          connectionId: trigConnectionId,
          action,
          filters: {
            method: filterMethod || undefined,
            tableName: filterTableName || undefined,
            pathContains: filterPathContains || undefined
          },
          namespaceTags: selectedNamespaces,
          active: true
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save trigger')
      await fetchTriggers()
      alert('Trigger saved')
    } catch (e: any) {
      alert(e.message || 'Failed to save trigger')
    }
    setSaving(false)
  }

  async function testFire(eventType: string) {
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        action = { 
          type: 'whapi_message', 
          to: trigTo, 
          textTemplate: trigTemplate 
        }
        break
      case 'community':
        action = { 
          type: 'whapi_community', 
          communityId: selectedCommunity,
          groupIds: selectedGroups,
          messageTemplate: trigTemplate 
        }
        break
      case 'group':
        action = { 
          type: 'whapi_group', 
          groupIds: selectedGroups,
          messageTemplate: trigTemplate 
        }
        break
    }

    const tempTrigger = {
      id: 'temp-test-trigger',
      name: 'Test Trigger',
      eventType: eventType,
      connectionId: trigConnectionId,
      action: action,
      filters: {
        method: filterMethod || undefined,
        tableName: filterTableName || undefined,
        pathContains: filterPathContains || undefined
      },
      namespaceTags: selectedNamespaces,
      active: true
    }
    
    try {
      const res = await fetch(`${apiBase}/notify/temp-test-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: tempTrigger,
          event: {
            type: eventType,
            method: 'POST',
            path: '/unified/namespaces',
            resource: 'unified_api',
            data: { response: { id: 'ns-123', timestamp: new Date().toISOString() } }
          }
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Test fire failed')
      await fetchLogs()
      alert('Test event fired successfully')
    } catch (e: any) {
      console.error('Test fire error:', e)
      alert(e.message || 'Test fire failed')
    }
  }

  async function testSpecificTrigger(triggerId: string) {
    try {
      const res = await fetch(`${apiBase}/notify/${triggerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            type: trigEvent,
            method: 'POST',
            path: '/unified/namespaces',
            resource: 'unified_api',
            data: { response: { id: 'ns-123', timestamp: new Date().toISOString() } }
          }
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Trigger test failed')
      await fetchLogs()
      alert('Trigger test fired successfully')
    } catch (e: any) {
      console.error('Specific trigger test error:', e)
      alert(e.message || 'Trigger test failed')
    }
  }

  const NavItem = ({ id, label, icon }: { id: TabKey, label: string, icon: React.ReactNode }) => (
    <button
      className={`group w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 relative transition-colors ${
        active === id 
          ? 'text-blue-600 bg-blue-50 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      onClick={() => setActive(id)}
    >
      <span className={`${active === id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {icon}
      </span>
      <span className="truncate font-medium">{label}</span>
    </button>
  )


  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">Configure WhatsApp notifications for tasks, projects, and teams</p>
          </div>
        </div>

        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex gap-1">
              <button
                onClick={() => setActive('triggers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'triggers' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Zap size={16} className="inline mr-2" />
                Triggers
              </button>
              <button
                onClick={() => setActive('templates')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'templates' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Templates
              </button>
              <button
                onClick={() => setActive('configuration')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'configuration' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Configuration
              </button>
              <button
                onClick={() => setActive('config')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'config' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings size={16} className="inline mr-2" />
                WHAPI Config
              </button>
              <button
                onClick={() => setActive('test')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'test' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Send size={16} className="inline mr-2" />
                Test Send
              </button>
              <button
                onClick={() => setActive('logs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active === 'logs' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={16} className="inline mr-2" />
                Logs
              </button>
            </div>
          </div>
        </div>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden">
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setActive('triggers')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'triggers' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Zap size={16} className="mx-auto mb-1" />
                  Triggers
                </button>
                <button
                  onClick={() => setActive('templates')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'templates' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={16} className="mx-auto mb-1" />
                  Templates
                </button>
                <button
                  onClick={() => setActive('configuration')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'configuration' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users size={16} className="mx-auto mb-1" />
                  Config
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                <button
                  onClick={() => setActive('config')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'config' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={16} className="mx-auto mb-1" />
                  WHAPI
                </button>
                <button
                  onClick={() => setActive('test')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'test' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Send size={16} className="mx-auto mb-1" />
                  Test
                </button>
                <button
                  onClick={() => setActive('logs')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active === 'logs' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List size={16} className="mx-auto mb-1" />
                  Logs
                </button>
              </div>
            </div>
          </div>

          {active === 'config' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium text-gray-900">WHAPI Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600 font-medium">Connection Name</label>
                  <input 
                    value={connName} 
                    onChange={e=>setConnName(e.target.value)} 
                    className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                    placeholder="e.g. default" 
                  />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600 font-medium">WHAPI Token</label>
                  <input 
                    value={connToken} 
                    onChange={e=>setConnToken(e.target.value)} 
                    className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                    placeholder="Enter WHAPI token" 
                  />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600 font-medium">Base URL</label>
                  <input 
                    value={connBaseUrl} 
                    onChange={e=>setConnBaseUrl(e.target.value)} 
                    className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                    placeholder="https://gate.whapi.cloud" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  id="tm" 
                  type="checkbox" 
                  checked={connTestMode} 
                  onChange={e=>setConnTestMode(e.target.checked)} 
                  className="accent-blue-600 h-4 w-4" 
                />
                <label htmlFor="tm" className="text-sm text-gray-600">Test Mode (do not call WHAPI)</label>
              </div>
              <div className="flex gap-2">
                <button 
                  disabled={saving} 
                  onClick={saveConnection} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={fetchConnections} 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="border rounded-lg">
                <div className="px-3 py-2 text-sm text-gray-500 font-medium">Saved Connections</div>
                <div className="divide-y max-h-56 overflow-auto">
                  {connections.map((c) => (
                    <div key={c.id} className="px-3 py-2 text-sm flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.id}</div>
                      </div>
                      <button 
                        onClick={()=>setTrigConnectionId(c.id)} 
                        className={`text-xs px-2 py-1 border rounded ${
                          trigConnectionId===c.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === 'triggers' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Notification Triggers</h2>
              <p className="text-sm text-gray-500">Create triggers that fire on backend events and send messages via WHAPI.</p>

              <div className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Trigger Type</label>
                      <select 
                        value={triggerType} 
                        onChange={e=>setTriggerType(e.target.value as 'users' | 'community' | 'group')} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                      >
                        <option value="users">Users</option>
                        <option value="community">Community</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Event</label>
                      <select 
                        value={trigEvent} 
                        onChange={e=>setTrigEvent(e.target.value)} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                      >
                        <option value="task_created">Task Created</option>
                        <option value="task_updated">Task Updated</option>
                        <option value="task_deleted">Task Deleted</option>
                        <option value="project_created">Project Created</option>
                        <option value="project_updated">Project Updated</option>
                        <option value="project_deleted">Project Deleted</option>
                        <option value="team_created">Team Created</option>
                        <option value="team_updated">Team Updated</option>
                        <option value="team_deleted">Team Deleted</option>
                        <option value="none">None (Manual Only)</option>
                      </select>
                      {trigEvent === 'none' && (
                        <div className="text-xs text-orange-600">
                          ⚠️ This trigger will only fire when manually called via URL
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Connection</label>
                      <select 
                        value={trigConnectionId} 
                        onChange={e=>setTrigConnectionId(e.target.value)} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                      >
                        <option value="">Select connection</option>
                        {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Test Connection</label>
                      <button 
                        onClick={() => testConnection(trigConnectionId)} 
                        disabled={!trigConnectionId}
                        className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Test
                      </button>
                    </div>
                  </div>

                  {/* Users Type Recipient */}
                  {triggerType === 'users' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600 font-medium">Recipient Type:</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              value="manual" 
                              checked={contactMode === 'manual'} 
                              onChange={e => setContactMode(e.target.value as 'manual' | 'contact')}
                              className="accent-blue-600"
                            />
                            <span className="text-sm">Manual Entry</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              value="contact" 
                              checked={contactMode === 'contact'} 
                              onChange={e => setContactMode(e.target.value as 'manual' | 'contact')}
                              className="accent-blue-600"
                            />
                            <span className="text-sm">From Contacts</span>
                          </label>
                        </div>
                      </div>

                      {contactMode === 'manual' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-3 flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">Country Code</label>
                            <select 
                              value={countryCode} 
                              onChange={e=>setCountryCode(e.target.value)} 
                              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                            >
                              <option value="91">+91 (India)</option>
                              <option value="1">+1 (USA/Canada)</option>
                              <option value="44">+44 (UK)</option>
                              <option value="49">+49 (Germany)</option>
                              <option value="33">+33 (France)</option>
                              <option value="39">+39 (Italy)</option>
                              <option value="34">+34 (Spain)</option>
                              <option value="7">+7 (Russia)</option>
                              <option value="86">+86 (China)</option>
                              <option value="81">+81 (Japan)</option>
                              <option value="82">+82 (South Korea)</option>
                              <option value="61">+61 (Australia)</option>
                              <option value="55">+55 (Brazil)</option>
                              <option value="52">+52 (Mexico)</option>
                              <option value="971">+971 (UAE)</option>
                              <option value="966">+966 (Saudi Arabia)</option>
                              <option value="974">+974 (Qatar)</option>
                              <option value="965">+965 (Kuwait)</option>
                              <option value="973">+973 (Bahrain)</option>
                              <option value="968">+968 (Oman)</option>
                            </select>
                          </div>
                          <div className="lg:col-span-9 flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">Phone Number</label>
                            <input 
                              value={phoneNumber} 
                              onChange={e=>setPhoneNumber(e.target.value)} 
                              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                              placeholder="e.g. 1234567890" 
                            />
                          </div>
                        </div>
                      )}

                      {contactMode === 'contact' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-12 flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">
                              Select Contact 
                              {contacts.length > 0 && <span className="text-blue-600">({contacts.length} found)</span>}
                            </label>
                            <div className="flex gap-2">
                              <select 
                                value={selectedContact} 
                                onChange={e=>setSelectedContact(e.target.value)} 
                                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                                disabled={loadingContacts || !trigConnectionId}
                              >
                                <option value="">Select a contact</option>
                                {contacts.map(contact => (
                                  <option key={contact.id} value={contact.id}>
                                    {contact.pushname || contact.name || contact.display_name || contact.id}
                                    {contact.id && ` (${contact.id})`}
                                  </option>
                                ))}
                              </select>
                              <button 
                                onClick={() => fetchContacts(trigConnectionId)} 
                                disabled={!trigConnectionId || loadingContacts}
                                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                              >
                                {loadingContacts ? '...' : 'Refresh'}
                              </button>
                            </div>
                            {!trigConnectionId && (
                              <div className="text-xs text-gray-500">Please select a connection first</div>
                            )}
                            {trigConnectionId && contacts.length === 0 && !loadingContacts && (
                              <div className="text-xs text-orange-600">No contacts found. Click Refresh to fetch.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Community Type Selection */}
                  {triggerType === 'community' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-6 flex flex-col gap-1">
                          <label className="text-sm text-gray-600 font-medium">Community</label>
                          <div className="flex gap-2">
                            <select 
                              value={selectedCommunity} 
                              onChange={e=>setSelectedCommunity(e.target.value)} 
                              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                              disabled={loadingCommunities}
                            >
                              <option value="">Select community</option>
                              {communities.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.title || c.name || c.id}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => fetchCommunities(trigConnectionId)} 
                              disabled={!trigConnectionId || loadingCommunities}
                              className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                              {loadingCommunities ? '...' : 'Refresh'}
                            </button>
                          </div>
                        </div>
                        <div className="lg:col-span-6 flex flex-col gap-1">
                          <label className="text-sm text-gray-600 font-medium">
                            Subgroups 
                            {subgroups.length > 0 && <span className="text-blue-600">({subgroups.length} found)</span>}
                            {selectedGroups.length > 0 && <span className="text-green-600"> • {selectedGroups.length} selected</span>}
                          </label>
                          <div className="flex gap-2">
                            <select 
                              value="" 
                              onChange={e => {
                                if (e.target.value && !selectedGroups.includes(e.target.value)) {
                                  setSelectedGroups([...selectedGroups, e.target.value])
                                }
                              }}
                              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                              disabled={loadingSubgroups || !selectedCommunity}
                            >
                              <option value="">Select subgroup to add...</option>
                              {subgroups
                                .filter(sg => !selectedGroups.includes(sg.id))
                                .map(sg => (
                                  <option key={sg.id} value={sg.id}>
                                    {sg.type === 'announcement' ? '📢 ' : '💬 '}
                                    {sg.title || sg.name || sg.id}
                                    {sg.type === 'announcement' ? ' (Announcement)' : ''}
                                  </option>
                                ))}
                            </select>
                            <button 
                              onClick={() => fetchSubgroups(trigConnectionId, selectedCommunity)} 
                              disabled={!trigConnectionId || !selectedCommunity || loadingSubgroups}
                              className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                              {loadingSubgroups ? '...' : 'Refresh'}
                            </button>
                          </div>
                          
                          {/* Selected Subgroups Display */}
                          {selectedGroups.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedGroups.map(groupId => {
                                const group = subgroups.find(sg => sg.id === groupId)
                                return (
                                  <span 
                                    key={groupId}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                                  >
                                    {group?.type === 'announcement' ? '📢' : '💬'}
                                    {group?.title || group?.name || groupId}
                                    <button 
                                      onClick={() => setSelectedGroups(selectedGroups.filter(id => id !== groupId))}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          
                          {!selectedCommunity && (
                            <div className="text-xs text-gray-500">Please select a community first</div>
                          )}
                          {selectedCommunity && subgroups.length === 0 && !loadingSubgroups && (
                            <div className="text-xs text-orange-600">No subgroups found. Click Refresh to fetch.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Group Type Selection */}
                  {triggerType === 'group' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-12 flex flex-col gap-1">
                          <label className="text-sm text-gray-600 font-medium">Groups</label>
                          <div className="flex gap-2">
                            <select 
                              value={selectedGroups[0] || ''} 
                              onChange={e=>setSelectedGroups(e.target.value ? [e.target.value] : [])} 
                              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                              disabled={loadingGroups}
                            >
                              <option value="">Select group</option>
                              {groups.map(g => (
                                <option key={g.id} value={g.id}>
                                  {g.title || g.name || g.id}
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => fetchGroups(trigConnectionId)} 
                              disabled={!trigConnectionId || loadingGroups}
                              className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                              {loadingGroups ? '...' : 'Refresh'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Filter: HTTP Method</label>
                      <input 
                        value={filterMethod} 
                        onChange={e=>setFilterMethod(e.target.value)} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                        placeholder="e.g. POST, PUT" 
                      />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Filter: Table Name</label>
                      <input 
                        value={filterTableName} 
                        onChange={e=>setFilterTableName(e.target.value)} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                        placeholder="e.g. tasks, projects" 
                      />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600 font-medium">Filter: Path Contains</label>
                      <input 
                        value={filterPathContains} 
                        onChange={e=>setFilterPathContains(e.target.value)} 
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                        placeholder="e.g. /tasks, /projects" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 font-medium">
                      Namespace Tags 
                      {selectedNamespaces.length > 0 && <span className="text-blue-600">({selectedNamespaces.length} selected)</span>}
                    </label>
                    
                    {/* Existing Namespaces Selection */}
                    <div className="flex gap-2">
                      <select 
                        value="" 
                        onChange={e => {
                          if (e.target.value && !selectedNamespaces.includes(e.target.value)) {
                            setSelectedNamespaces([...selectedNamespaces, e.target.value])
                          }
                        }}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                        disabled={loadingNamespaces}
                      >
                        <option value="">Select BRMH namespace...</option>
                        {availableNamespaces
                          .filter(ns => !selectedNamespaces.includes(ns.id))
                          .map(ns => (
                            <option key={ns.id} value={ns.id}>
                              {ns.name || ns.id}
                            </option>
                          ))}
                      </select>
                      <button 
                        onClick={fetchNamespaces} 
                        disabled={loadingNamespaces}
                        className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                      >
                        {loadingNamespaces ? '...' : 'Refresh'}
                      </button>
                    </div>
                    
                    {/* Custom Tag Input */}
                    <div className="flex gap-2">
                      <input 
                        value={customTag}
                        onChange={e => setCustomTag(e.target.value)}
                        placeholder="Or enter custom tag..."
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                        onKeyPress={e => {
                          if (e.key === 'Enter' && customTag.trim() && !selectedNamespaces.includes(customTag.trim())) {
                            setSelectedNamespaces([...selectedNamespaces, customTag.trim()])
                            setCustomTag('')
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (customTag.trim() && !selectedNamespaces.includes(customTag.trim())) {
                            setSelectedNamespaces([...selectedNamespaces, customTag.trim()])
                            setCustomTag('')
                          }
                        }}
                        disabled={!customTag.trim() || selectedNamespaces.includes(customTag.trim())}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Selected Tags Display */}
                    {selectedNamespaces.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedNamespaces.map(tag => {
                          const ns = availableNamespaces.find(n => n.id === tag)
                          return (
                            <span 
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                            >
                              {ns?.name || tag}
                              <button 
                                onClick={() => setSelectedNamespaces(selectedNamespaces.filter(t => t !== tag))}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Select BRMH namespaces or enter custom tags. Logs will be filtered by these tags.
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 font-medium">Trigger Name</label>
                    <input 
                      value={trigName} 
                      onChange={e=>setTrigName(e.target.value)} 
                      className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                      placeholder="My Trigger" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600 font-medium">Message Template</label>
                    <textarea 
                      value={trigTemplate} 
                      onChange={e=>setTrigTemplate(e.target.value)} 
                      className="border rounded-lg px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                      placeholder="Message template using {{trigger}} and {{event}} context" 
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        if (!trigConnectionId) {
                          alert('Please select a connection first')
                          return
                        }
                        if (triggerType === 'users' && !trigTo) {
                          alert('Please enter a recipient for users trigger')
                          return
                        }
                        if (triggerType === 'community' && (!selectedCommunity || selectedGroups.length === 0)) {
                          alert('Please select a community and at least one subgroup')
                          return
                        }
                        if (triggerType === 'group' && selectedGroups.length === 0) {
                          alert('Please select groups')
                          return
                        }
                        testFire(trigEvent)
                      }} 
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Test Fire
                    </button>
                    <button 
                      disabled={saving} 
                      onClick={saveTrigger} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Trigger'}
                    </button>
                  </div>
                </div>

                {/* Existing Triggers */}
                <div className="border rounded-lg">
                  <div className="px-3 py-2 text-sm text-gray-500 font-medium">Existing Triggers</div>
                  <div className="divide-y max-h-64 overflow-auto">
                    {triggers.map(t => (
                      <div key={t.id} className="px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {t.action?.type || 'whapi'}
                            </span>
                            <span className="text-xs text-gray-500">{t.eventType}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {t.action?.type === 'whapi_message' && `to: ${t.action?.to}`}
                          {t.action?.type === 'whapi_community' && `community: ${t.action?.communityId} • groups: ${t.action?.groupIds?.length || 0}`}
                          {t.action?.type === 'whapi_group' && `groups: ${t.action?.groupIds?.length || 0}`}
                          {!t.action?.type && `to: ${t.action?.to}`}
                          {' • '}conn: {t.connectionId}
                        </div>
                        {t.namespaceTags && t.namespaceTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.namespaceTags.map((tag: string) => (
                              <span key={tag} className="text-xs px-1 py-0.5 bg-blue-100 text-blue-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {active === 'configuration' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <NotificationConfigPanel />
            </section>
          )}

          {active === 'templates' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <NotificationTemplates />
            </section>
          )}

          {active === 'test' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Test Send</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 font-medium">Saved Connections</div>
                  <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                    {connections.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No connections found.</div>}
                    {connections.map(c => (
                      <div key={c.id} className="px-3 py-2 text-sm">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 font-medium">Saved Triggers</div>
                  <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                    {triggers.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No triggers found.</div>}
                    {triggers.map(t => (
                      <div key={t.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            event: {t.eventType} • type: {t.action?.type || 'whapi'}
                            {t.action?.type === 'whapi_message' && ` • to: ${t.action?.to}`}
                            {t.action?.type === 'whapi_community' && ` • community: ${t.action?.communityId} • groups: ${t.action?.groupIds?.length || 0}`}
                            {t.action?.type === 'whapi_group' && ` • groups: ${t.action?.groupIds?.length || 0}`}
                          </div>
                          <div className="text-xs text-blue-600 truncate">ID: {t.id}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={()=>testSpecificTrigger(t.id)} 
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                          >
                            Test
                          </button>
                          <button 
                            onClick={() => {
                              const backendUrl = apiBase || 'https://brmh.in';
                              const url = `${backendUrl}/notify/${t.id}`;
                              navigator.clipboard.writeText(url);
                              alert('Trigger URL copied to clipboard!');
                            }} 
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Tests send a synthetic payload to the backend `/notify/test` for the selected event type and your active triggers will execute (in test mode if your connection is test mode).</div>
                  <div className="font-medium">Manual Trigger Firing:</div>
                  <div>You can manually fire any trigger by making a request to: <code className="bg-gray-100 px-1 rounded">brmh.in/notify/{'{triggerId}'}</code></div>
                  <div>Example: <code className="bg-gray-100 px-1 rounded">GET brmh.in/notify/abc123</code> or <code className="bg-gray-100 px-1 rounded">POST brmh.in/notify/abc123</code> with custom event data in body.</div>
                  <div className="text-blue-600">Local development: <code className="bg-gray-100 px-1 rounded">localhost:5001/notify/{'{triggerId}'}</code></div>
                  <div className="text-orange-600">⚠️ Triggers with "None (Manual Only)" event type will only fire when manually called via URL, never automatically.</div>
                  <div className="font-medium">Custom Message Override:</div>
                  <div>You can override the message template by including a custom message in the request body:</div>
                  <div><code className="bg-gray-100 px-1 rounded">POST brmh.in/notify/abc123</code> with body: <code className="bg-gray-100 px-1 rounded">{"{message: \"Your custom message here\"}"}</code></div>
                  <div className="text-green-600">✓ Custom messages will override the trigger's default message template</div>
                </div>
              </div>
            </section>
          )}

          {active === 'logs' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Delivery Logs</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={logNamespaceFilter} 
                  onChange={e => {
                    setLogNamespaceFilter(e.target.value)
                    fetchLogs(e.target.value || undefined)
                  }}
                  className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="">All Namespaces</option>
                  {availableNamespaces.map(ns => (
                    <option key={ns.id} value={ns.id}>
                      {ns.name || ns.id}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => fetchLogs(logNamespaceFilter || undefined)} 
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                >
                  Refresh
                </button>
                {loadingLogs && <span className="text-xs text-gray-500">Loading...</span>}
              </div>
              <div className="border rounded-lg divide-y max-h-[480px] overflow-auto">
                {logs.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No logs yet. Messages and response statuses will appear here.</div>
                )}
                {logs.map((l: Log) => (
                  <div key={l.id} className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{l.kind}</div>
                      <div className={`text-xs ${l.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                        {l.status || 'ok'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{l.createdAt}</div>
                    {l.eventType && <div className="text-xs">event: {l.eventType}</div>}
                    {l.triggerId && <div className="text-xs">trigger: {l.triggerId}</div>}
                    {l.namespaceTags && l.namespaceTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {l.namespaceTags.map((tag: string) => (
                          <span key={tag} className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>
    </AppLayout>
  )
}

export default NotificationsPage
