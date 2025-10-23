"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Settings, Zap, Send, List, Users, Building2, CheckSquare, Plus, Edit, Trash2, Smartphone, MessageSquare, Globe, ChevronDown, ChevronRight, Target, AlertCircle, Phone, Mail } from 'lucide-react';
import { apiService } from '../services/api';
import NotificationConfigPanel from '../components/NotificationConfigPanel';
import { AppLayout } from '../components/AppLayout';

type TabKey = 'connections' | 'triggers' | 'configurations'

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
}

interface BRMHUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BRMHTeam {
  id: string;
  name: string;
  members: BRMHUser[];
}

interface BRMHProject {
  id: string;
  name: string;
  team?: BRMHTeam;
}

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('connections')
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in')
  const [loading, setLoading] = useState(false)

  // Connection state
  const [connections, setConnections] = useState<Connection[]>([])
  const [connName, setConnName] = useState('default')
  const [connToken, setConnToken] = useState('')
  const [connBaseUrl, setConnBaseUrl] = useState('https://gate.whapi.cloud')
  const [connTestMode, setConnTestMode] = useState(true)

  // Trigger state
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [trigName, setTrigName] = useState('')
  const [trigEvent, setTrigEvent] = useState('task_created')
  const [trigConnectionId, setTrigConnectionId] = useState<string>('')
  const [trigTemplate, setTrigTemplate] = useState("")
  const [triggerType, setTriggerType] = useState<'users' | 'community' | 'group'>('users')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('91')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [communities, setCommunities] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [subgroups, setSubgroups] = useState<any[]>([])

  // BRMH Data
  const [brmhUsers, setBrmhUsers] = useState<BRMHUser[]>([])
  const [brmhTeams, setBrmhTeams] = useState<BRMHTeam[]>([])
  const [brmhProjects, setBrmhProjects] = useState<BRMHProject[]>([])

  // Logs
  const [logs, setLogs] = useState<Log[]>([])

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
    if (saved) setActiveTab(saved)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('notif.activeTab', activeTab)
  }, [activeTab])

  // Fetch data functions
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

  async function fetchLogs() {
    try {
      const res = await fetch(`${apiBase}/notify/logs`, { cache: 'no-store' })
      const data = await res.json()
      if (data?.items) setLogs(data.items)
    } catch {}
  }

  async function fetchBRMHUsers() {
    try {
      const result = await apiService.getUsers()
      if (result.success && Array.isArray(result.data)) setBrmhUsers(result.data as any)
    } catch {}
  }

  async function fetchBRMHTeams() {
    try {
      const result = await apiService.getTeams()
      if (result.success && Array.isArray(result.data)) setBrmhTeams(result.data as any)
    } catch {}
  }

  async function fetchBRMHProjects() {
    try {
      const result = await apiService.getProjects()
      if (result.success && Array.isArray(result.data)) setBrmhProjects(result.data as any)
    } catch {}
  }

  async function fetchCommunities(connectionId: string) {
    if (!connectionId) return
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
  }

  async function fetchGroups(connectionId: string) {
    if (!connectionId) return
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
  }

  async function fetchSubgroups(connectionId: string, communityId: string) {
    if (!connectionId || !communityId) return
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

  useEffect(() => {
    fetchConnections()
    fetchTriggers()
    fetchLogs()
    fetchBRMHUsers()
    fetchBRMHTeams()
    fetchBRMHProjects()
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

  // No derived state needed for phone; compute on demand

  async function saveConnection() {
    setLoading(true)
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
    setLoading(false)
  }

  async function saveTrigger() {
    if (!trigConnectionId) return alert('Please select a connection')
    
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        if (!phoneNumber) return alert('Please enter phone number for users trigger')
        action = { 
          type: 'whapi_message', 
          to: countryCode + phoneNumber, 
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
    
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/notify/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trigName,
          eventType: trigEvent,
          connectionId: trigConnectionId,
          action,
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
    setLoading(false)
  }

  async function testFire(eventType: string) {
    let action: any = {}
    
    switch (triggerType) {
      case 'users':
        action = { 
          type: 'whapi_message', 
          to: countryCode + phoneNumber, 
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

  const TabButton = ({ id, label, icon }: { id: TabKey, label: string, icon: React.ReactNode }) => (
    <button
      className={`w-full flex flex-col sm:flex-row sm:items-center sm:gap-2 items-center justify-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-50 border border-transparent'
      }`}
      onClick={() => setActiveTab(id)}
      aria-label={label}
    >
      <div className="flex items-center justify-center">{icon}</div>
      <span className="mt-1 sm:mt-0 text-[11px] sm:text-sm leading-tight">{label}</span>
    </button>
  )

  return (
    <AppLayout>
      <div className="w-full px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Configure WhatsApp notifications for your project management system</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              <TabButton id="connections" label="WHAPI" icon={<Settings size={18} />} />
              <TabButton id="triggers" label="Triggers" icon={<Zap size={18} />} />
              <TabButton id="configurations" label="Configs" icon={<Target size={18} />} />
            </div>
          </div>
        </div>

        {/* WHAPI Setup Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">WHAPI Configuration</h2>
                  <p className="text-sm text-gray-600">Set up your WhatsApp API connection</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection Name</label>
                  <input 
                    value={connName} 
                    onChange={e=>setConnName(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                    placeholder="e.g. Production" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WHAPI Token</label>
                  <input 
                    value={connToken} 
                    onChange={e=>setConnToken(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                    placeholder="Enter your WHAPI token" 
                    type="password"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input 
                  value={connBaseUrl} 
                  onChange={e=>setConnBaseUrl(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                  placeholder="https://gate.whapi.cloud" 
                />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <input 
                  id="testMode" 
                  type="checkbox" 
                  checked={connTestMode} 
                  onChange={e=>setConnTestMode(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                />
                <label htmlFor="testMode" className="text-sm text-gray-700">
                  Test Mode (don't send actual messages)
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  disabled={loading} 
                  onClick={saveConnection} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save Connection'}
                </button>
                <button 
                  onClick={fetchConnections} 
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Saved Connections */}
            {connections.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Connections</h3>
                <div className="space-y-3">
                  {connections.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Smartphone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-sm text-gray-500">{c.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={()=>testConnection(c.id)} 
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Test
                        </button>
                        <button 
                          onClick={()=>setTrigConnectionId(c.id)} 
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            trigConnectionId===c.id 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {trigConnectionId===c.id ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create Trigger</h2>
                  <p className="text-sm text-gray-600">Set up automated notifications for events</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Name</label>
                  <input 
                    value={trigName} 
                    onChange={e=>setTrigName(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                    placeholder="e.g. Task Assignment Alert" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select 
                    value={trigEvent} 
                    onChange={e=>setTrigEvent(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
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
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Connection</label>
                <select 
                  value={trigConnectionId} 
                  onChange={e=>setTrigConnectionId(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
                >
                  <option value="">Select connection</option>
                  {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTriggerType('users')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      triggerType === 'users' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium">Users</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTriggerType('community')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      triggerType === 'community' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-medium">Community</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTriggerType('group')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      triggerType === 'group' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-medium">Groups</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Users Configuration */}
              {triggerType === 'users' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Phone Number Configuration</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                      <select 
                        value={countryCode} 
                        onChange={e=>setCountryCode(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors text-sm"
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
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        value={phoneNumber} 
                        onChange={e=>setPhoneNumber(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                        placeholder="e.g. 1234567890" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Community Configuration */}
              {triggerType === 'community' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Community Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Community</label>
                      <select 
                        value={selectedCommunity} 
                        onChange={e=>setSelectedCommunity(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
                      >
                        <option value="">Select community</option>
                        {communities.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title || c.name || c.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subgroups</label>
                      <select 
                        value="" 
                        onChange={e => {
                          if (e.target.value && !selectedGroups.includes(e.target.value)) {
                            setSelectedGroups([...selectedGroups, e.target.value])
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
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
                    </div>
                  </div>
                  
                  {/* Selected Subgroups Display */}
                  {selectedGroups.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Selected Subgroups</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroups.map(groupId => {
                          const group = subgroups.find(sg => sg.id === groupId)
                          return (
                            <span 
                              key={groupId}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                            >
                              {group?.type === 'announcement' ? '📢' : '💬'}
                              {group?.title || group?.name || groupId}
                              <button 
                                onClick={() => setSelectedGroups(selectedGroups.filter(id => id !== groupId))}
                                className="text-green-600 hover:text-green-800 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Group Configuration */}
              {triggerType === 'group' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Group Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Groups</label>
                    <select 
                      value={selectedGroups[0] || ''} 
                      onChange={e=>setSelectedGroups(e.target.value ? [e.target.value] : [])} 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
                    >
                      <option value="">Select group</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title || g.name || g.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
                <textarea 
                  value={trigTemplate} 
                  onChange={e=>setTrigTemplate(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors" 
                  placeholder="Enter your message template here. Use variables like {{task.title}}, {{user.name}}, etc." 
                />
                <p className="text-sm text-gray-500 mt-2">
                  Available variables: {`{{task.title}}, {{task.assignee}}, {{project.name}}, {{team.name}}, {{user.name}}`}
                </p>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => testFire(trigEvent)} 
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Test Trigger
                </button>
                <button 
                  disabled={loading} 
                  onClick={saveTrigger} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save Trigger'}
                </button>
              </div>
            </div>

            {/* Existing Triggers */}
            {triggers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Triggers</h3>
                <div className="space-y-3">
                  {triggers.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{t.name}</div>
                          <div className="text-sm text-gray-500">
                            {t.eventType} • {t.action?.type || 'whapi'}
                            {t.action?.type === 'whapi_message' && ` • to: ${t.action?.to}`}
                            {t.action?.type === 'whapi_community' && ` • community: ${t.action?.communityId}`}
                            {t.action?.type === 'whapi_group' && ` • groups: ${t.action?.groupIds?.length || 0}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={()=>testSpecificTrigger(t.id)} 
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Test
                        </button>
                        <button 
                          onClick={() => {
                            const url = `${apiBase}/notify/${t.id}`;
                            navigator.clipboard.writeText(url);
                            alert('Trigger URL copied to clipboard!');
                          }} 
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Configuration Tab */}
        {activeTab === 'configurations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Event Configuration</h2>
                  <p className="text-sm text-gray-600">Configure which notifications to send for specific events</p>
                </div>
              </div>
              <NotificationConfigPanel />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default NotificationsPage