"use client";
import React, { useEffect, useState } from 'react'
import { Bell, Settings, Zap, FileText, Send, List, Info } from 'lucide-react'

type TabKey = 'overview' | 'config' | 'triggers' | 'templates' | 'test' | 'logs'

const Page = () => {
  const [active, setActive] = useState<TabKey>('overview')
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001')
  const [saving, setSaving] = useState(false)

  // Config form
  const [connName, setConnName] = useState('default')
  const [connToken, setConnToken] = useState('')
  const [connBaseUrl, setConnBaseUrl] = useState('https://gate.whapi.cloud')
  const [connTestMode, setConnTestMode] = useState(true)
  const [connections, setConnections] = useState<any[]>([])

  // Trigger form
  const [triggers, setTriggers] = useState<any[]>([])
  const [trigName, setTrigName] = useState('Namespace Created Alert')
  const [trigEvent, setTrigEvent] = useState('namespace_created')
  const [trigTo, setTrigTo] = useState('10000000000')
  const [countryCode, setCountryCode] = useState('91')
  const [phoneNumber, setPhoneNumber] = useState('10000000000')
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [contactMode, setContactMode] = useState<'manual' | 'contact'>('manual')
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [trigTemplate, setTrigTemplate] = useState("Namespace created at {{event.data.response.timestamp}}")
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
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logNamespaceFilter, setLogNamespaceFilter] = useState<string>('')

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
      console.log('Communities response:', data)
      
      let communities = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        // WHAPI returns communities in announceGroupInfo and otherGroups
        if (responseData.announceGroupInfo) {
          communities.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          communities.push(...responseData.otherGroups)
        }
        
        // Fallback for other possible structures
        if (communities.length === 0) {
          if (responseData.communities && Array.isArray(responseData.communities)) {
            communities = responseData.communities
          } else if (Array.isArray(responseData)) {
            communities = responseData
          }
        }
      }
      
      console.log('Extracted communities:', communities)
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
      console.log('Groups response:', data)
      
      let groups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        // WHAPI returns groups in announceGroupInfo and otherGroups
        if (responseData.announceGroupInfo) {
          groups.push(responseData.announceGroupInfo)
        }
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          groups.push(...responseData.otherGroups)
        }
        
        // Fallback for other possible structures
        if (groups.length === 0) {
          if (responseData.groups && Array.isArray(responseData.groups)) {
            groups = responseData.groups
          } else if (Array.isArray(responseData)) {
            groups = responseData
          }
        }
      }
      
      console.log('Extracted groups:', groups)
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
      console.log('Subgroups response:', data)
      
      let subgroups = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        // Include announcement group if it exists
        if (responseData.announceGroupInfo) {
          subgroups.push({
            ...responseData.announceGroupInfo,
            type: 'announcement'
          })
        }
        
        // Add other groups
        if (responseData.otherGroups && Array.isArray(responseData.otherGroups)) {
          subgroups.push(...responseData.otherGroups.map((group: any) => ({
            ...group,
            type: 'subgroup'
          })))
        }
        
        // Fallback for other possible structures
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
        
        // Additional fallback - check if the data itself is an array of groups
        if (subgroups.length === 0 && responseData) {
          // Check if responseData has group-like properties
          if (responseData.id && responseData.title) {
            subgroups = [{
              ...responseData,
              type: 'subgroup'
            }]
          }
        }
      }
      
      console.log('Extracted subgroups with announcement:', subgroups)
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
      console.log('Contacts response:', data)
      
      let contactsList = []
      if (data?.success && data?.testResult?.data) {
        const responseData = data.testResult.data
        
        // WHAPI returns contacts in testResult.data.contacts
        if (responseData.contacts && Array.isArray(responseData.contacts)) {
          contactsList = responseData.contacts
        } else if (responseData.data && Array.isArray(responseData.data)) {
          contactsList = responseData.data
        } else if (Array.isArray(responseData)) {
          contactsList = responseData
        }
      }
      
      // Filter out contacts with empty or invalid names/IDs
      const validContacts = contactsList.filter((contact: any) => 
        contact && 
        contact.id && 
        contact.id !== '0' && 
        (contact.pushname || contact.name || contact.display_name)
      )
      
      console.log('Extracted contacts:', contactsList)
      console.log('Valid contacts after filtering:', validContacts)
      setContacts(Array.isArray(validContacts) ? validContacts : [])
    } catch (e) {
      console.error('Failed to fetch contacts:', e)
    }
    setLoadingContacts(false)
  }

  async function fetchNamespaces() {
    setLoadingNamespaces(true)
    try {
      // Call the unified namespaces endpoint directly
      const res = await fetch(`${apiBase}/unified/namespaces`, { cache: 'no-store' })
      const data = await res.json()
      console.log('Namespaces response:', data)
      
      if (Array.isArray(data)) {
        // Format the data to extract namespace-name and namespace-id
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Create a temporary trigger with current form data for testing
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

    console.log('[Frontend] Testing with temp trigger:', tempTrigger)
    
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
      console.log('[Frontend] Test fire response:', { status: res.status, data })
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Test fire failed')
      await fetchLogs()
      alert('Test event fired successfully')
    } catch (e: any) {
      console.error('[Frontend] Test fire error:', e)
      alert(e.message || 'Test fire failed')
    }
  }

  async function testSpecificTrigger(triggerId: string) {
    console.log('[Frontend] Testing specific trigger:', triggerId)
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
      console.log('[Frontend] Specific trigger test response:', { status: res.status, data })
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Trigger test failed')
      await fetchLogs()
      alert('Trigger test fired successfully')
    } catch (e: any) {
      console.error('[Frontend] Specific trigger test error:', e)
      alert(e.message || 'Trigger test failed')
    }
  }

  const NavItem = ({ id, label, icon }: { id: TabKey, label: string, icon: React.ReactNode }) => (
    <button
      className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 relative ${active === id ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
      onClick={() => setActive(id)}
    >
      <span className={`absolute left-0 top-0 h-full w-1 rounded-r ${active === id ? 'bg-blue-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
      <span className={`${active === id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )

  return (
    <div className="p-0">
      <div className="flex gap-0">
        {/* Child Sidebar */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 rounded-none p-0 h-screen sticky top-0 overflow-hidden">
        
          {/* Search */}
          <div className="px-3 py-3 border-b">
            <input className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder="Search..." />
          </div>
          {/* Sections */}
          <div className="px-2 py-2 text-xs font-semibold text-gray-500">Sections</div>
          <nav className="flex flex-col gap-1 px-2">
            <NavItem id="overview" label="Overview" icon={<Info size={16} />} />
            <NavItem id="config" label="WHAPI Config" icon={<Settings size={16} />} />
            <NavItem id="triggers" label="Triggers" icon={<Zap size={16} />} />
            <NavItem id="templates" label="Templates" icon={<FileText size={16} />} />
            <NavItem id="test" label="Test Send" icon={<Send size={16} />} />
            <NavItem id="logs" label="Logs" icon={<List size={16} />} />
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Notification Service</h1>
            <p className="text-sm text-gray-500">Configure WHAPI, define triggers, and test WhatsApp notifications.</p>
          </div>

          {active === 'overview' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Overview</h2>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Use WHAPI to send WhatsApp messages for key events.</li>
                <li>Attach triggers to events like namespace, method, and account creation.</li>
                <li>Manage templates and test messages before enabling in production.</li>
              </ul>
            </section>
          )}

          {active === 'config' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">WHAPI Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Connection Name</label>
                  <input value={connName} onChange={e=>setConnName(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. default" />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">WHAPI Token</label>
                  <input value={connToken} onChange={e=>setConnToken(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="Enter WHAPI token" />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Base URL</label>
                  <input value={connBaseUrl} onChange={e=>setConnBaseUrl(e.target.value)} className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="https://gate.whapi.cloud" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="tm" type="checkbox" checked={connTestMode} onChange={e=>setConnTestMode(e.target.checked)} className="accent-blue-600 h-4 w-4" />
                <label htmlFor="tm" className="text-sm text-gray-600">Test Mode (do not call WHAPI)</label>
              </div>
              <div className="flex gap-2">
                <button disabled={saving} onClick={saveConnection} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={fetchConnections} className="px-4 py-2 border rounded-md">Refresh</button>
              </div>
              <div className="border rounded-md">
                <div className="px-3 py-2 text-sm text-gray-500">Saved Connections</div>
                <div className="divide-y max-h-56 overflow-auto">
                  {connections.map((c) => (
                    <div key={c.id} className="px-3 py-2 text-sm flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.id}</div>
                      </div>
                      <button onClick={()=>setTrigConnectionId(c.id)} className={`text-xs px-2 py-1 border rounded ${trigConnectionId===c.id ? 'bg-blue-50 border-blue-300' : ''}`}>Use</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === 'triggers' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Triggers</h2>
              <p className="text-sm text-gray-500">Create triggers that fire on backend events and send messages via WHAPI.</p>

              <div className="space-y-6">
                <div className="border rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Trigger Type</label>
                      <select value={triggerType} onChange={e=>setTriggerType(e.target.value as 'users' | 'community' | 'group')} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option value="users">Users</option>
                        <option value="community">Community</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Event</label>
                      <select value={trigEvent} onChange={e=>setTrigEvent(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option value="none">None (Manual Only)</option>
                        <option value="namespace_created">Namespace Created</option>
                        <option value="namespace_updated">Namespace Updated</option>
                        <option value="namespace_deleted">Namespace Deleted</option>
                        <option value="crud_create">CRUD Create</option>
                        <option value="crud_update">CRUD Update</option>
                        <option value="crud_delete">CRUD Delete</option>
                        <option value="crud_read">CRUD Read</option>
                      </select>
                      {trigEvent === 'none' && (
                        <div className="text-xs text-orange-600">
                          ⚠️ This trigger will only fire when manually called via URL
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Connection</label>
                      <select value={trigConnectionId} onChange={e=>setTrigConnectionId(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option value="">Select connection</option>
                        {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Test Connection</label>
                      <button 
                        onClick={() => testConnection(trigConnectionId)} 
                        disabled={!trigConnectionId}
                        className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                  {/* Users Type Recipient */}
                  {triggerType === 'users' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600">Recipient Type:</label>
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
                            <label className="text-sm text-gray-600">Country Code</label>
                            <select value={countryCode} onChange={e=>setCountryCode(e.target.value)} className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
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
                            <label className="text-sm text-gray-600">Phone Number</label>
                            <input 
                              value={phoneNumber} 
                              onChange={e=>setPhoneNumber(e.target.value)} 
                              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" 
                              placeholder="e.g. 1234567890" 
                            />
                          </div>
                        </div>
                      )}

                      {contactMode === 'contact' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-12 flex flex-col gap-1">
                            <label className="text-sm text-gray-600">
                              Select Contact 
                              {contacts.length > 0 && <span className="text-blue-600">({contacts.length} found)</span>}
                            </label>
                            <div className="flex gap-2">
                              <select 
                                value={selectedContact} 
                                onChange={e=>setSelectedContact(e.target.value)} 
                                className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                                className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
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
                          <label className="text-sm text-gray-600">Community</label>
                          <div className="flex gap-2">
                            <select 
                              value={selectedCommunity} 
                              onChange={e=>setSelectedCommunity(e.target.value)} 
                              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                              className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
                            >
                              {loadingCommunities ? '...' : 'Refresh'}
                            </button>
                          </div>
                        </div>
                        <div className="lg:col-span-6 flex flex-col gap-1">
                          <label className="text-sm text-gray-600">
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
                              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                              onClick={() => {
                                console.log('Fetching subgroups for community:', selectedCommunity)
                                fetchSubgroups(trigConnectionId, selectedCommunity)
                              }} 
                              disabled={!trigConnectionId || !selectedCommunity || loadingSubgroups}
                              className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
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
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-400">
                              Debug: Community: {selectedCommunity}, Subgroups: {JSON.stringify(subgroups.map(s => ({id: s.id, title: s.title, type: s.type}))).substring(0, 100)}...
                            </div>
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
                          <label className="text-sm text-gray-600">Groups</label>
                          <div className="flex gap-2">
                            <select 
                              value={selectedGroups[0] || ''} 
                              onChange={e=>setSelectedGroups(e.target.value ? [e.target.value] : [])} 
                              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                              className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
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
                      <label className="text-sm text-gray-600">Filter: HTTP Method</label>
                      <input value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. POST, PUT" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Filter: Table Name</label>
                      <input value={filterTableName} onChange={e=>setFilterTableName(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. shopify-orders" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Filter: Path Contains</label>
                      <input value={filterPathContains} onChange={e=>setFilterPathContains(e.target.value)} className="border rounded-md px-3 py-2" placeholder="e.g. /unified/namespaces" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">
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
                        className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                        className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
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
                        className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
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
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <label className="text-sm text-gray-600">Trigger Name</label>
                    <input value={trigName} onChange={e=>setTrigName(e.target.value)} className="border rounded-md px-3 py-2" placeholder="My Trigger" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea value={trigTemplate} onChange={e=>setTrigTemplate(e.target.value)} className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="Message template using {{trigger}} and {{event}} context" />
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
                      className="px-4 py-2 border rounded-md"
                    >
                      Test Fire
                    </button>
                    <button disabled={saving} onClick={saveTrigger} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60">{saving ? 'Saving...' : 'Save Trigger'}</button>
                  </div>
                </div>

                {/* Method Created */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="accent-blue-600 h-4 w-4" />
                      <span className="font-medium">On Method Created</span>
                    </label>
                    <span className="text-xs text-gray-500">Event: method.created</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient Type</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Number</option>
                        <option>Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient</label>
                      <input className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. +911234567890 or group-id@chat.whatsapp.com" />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Method</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Send Text</option>
                        <option>Send Template</option>
                        <option>Send Media</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. New method '{{name}}' added to namespace {{namespace}}." />
                  </div>
                </div>

                {/* Account Created */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="accent-blue-600 h-4 w-4" />
                      <span className="font-medium">On Account Created</span>
                    </label>
                    <span className="text-xs text-gray-500">Event: account.created</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-3 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient Type</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Number</option>
                        <option>Group</option>
                      </select>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Recipient</label>
                      <input className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. +911234567890 or group-id@chat.whatsapp.com" />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-1">
                      <label className="text-sm text-gray-600">Method</label>
                      <select className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                        <option>Send Text</option>
                        <option>Send Template</option>
                        <option>Send Media</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Message Template</label>
                    <textarea className="border rounded-md px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300" placeholder="e.g. New account '{{name}}' connected to namespace {{namespace}}." />
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="px-3 py-2 text-sm text-gray-500">Existing Triggers</div>
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
            </section>
          )}

          {active === 'templates' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 space-y-3">
                  <h3 className="font-medium">Template List</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center justify-between">
                      <span>Namespace Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Method Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Account Created</span>
                      <button className="text-xs px-2 py-1 border rounded">Edit</button>
                    </li>
                  </ul>
                </div>
                <div className="border rounded-md p-4 space-y-3">
                  <h3 className="font-medium">Editor</h3>
                  <div className="flex flex-col gap-2">
                    <input className="border rounded-md px-3 py-2" placeholder="Template Name" />
                    <textarea className="border rounded-md px-3 py-2 min-h-[140px]" placeholder="Message with variables like {{name}} and {{namespace}}" />
                    <div className="flex gap-2 justify-end">
                      <button className="px-4 py-2 border rounded-md">Reset</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Template</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {active === 'test' && (
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h2 className="text-lg font-medium">Test Send</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">Saved Connections</div>
                  <div className="border rounded-md divide-y max-h-64 overflow-auto">
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
                  <div className="text-sm text-gray-500">Saved Triggers</div>
                  <div className="border rounded-md divide-y max-h-64 overflow-auto">
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
                          <button onClick={()=>testSpecificTrigger(t.id)} className="text-xs px-2 py-1 border rounded">Test</button>
                          <button 
                            onClick={() => {
                              // Use backend URL instead of frontend URL
                              const backendUrl = apiBase || 'http://localhost:5001';
                              const url = `${backendUrl}/notify/${t.id}`;
                              navigator.clipboard.writeText(url);
                              alert('Trigger URL copied to clipboard!');
                            }} 
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
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
              <h2 className="text-lg font-medium">Delivery Logs</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={logNamespaceFilter} 
                  onChange={e => {
                    setLogNamespaceFilter(e.target.value)
                    fetchLogs(e.target.value || undefined)
                  }}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value="">All Namespaces</option>
                  {availableNamespaces.map(ns => (
                    <option key={ns.id} value={ns.id}>
                      {ns.name || ns.id}
                    </option>
                  ))}
                </select>
                <button onClick={() => fetchLogs(logNamespaceFilter || undefined)} className="px-3 py-1 border rounded text-sm">Refresh</button>
                {loadingLogs && <span className="text-xs text-gray-500">Loading...</span>}
              </div>
              <div className="border rounded-md divide-y max-h-[480px] overflow-auto">
                {logs.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No logs yet. Messages and response statuses will appear here.</div>
                )}
                {logs.map((l: any) => (
                  <div key={l.id} className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{l.kind}</div>
                      <div className={`text-xs ${l.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{l.status || 'ok'}</div>
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
      </div>
    </div>
  )
}

export default Page