'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Database, 
  Key, 
  Save, 
  Edit3, 
  Camera,
  Settings as SettingsIcon,
  UserCheck,
  Clock,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/AppLayout';
import { useTheme } from '../contexts/ThemeContext';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // User profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    role: user?.role || 'Member',
    department: '',
    joinDate: '2024-01-15'
  });

  // Settings state
  const [settings, setSettings] = useState({
    theme: theme,
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false,
      tasks: true,
      projects: true,
      teams: true
    },
    privacy: {
      profileVisibility: 'team',
      showEmail: true,
      showPhone: false,
      showLocation: false
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'system', label: 'System', icon: SettingsIcon }
  ];

  const handleSaveProfile = () => {
    // TODO: Implement save profile logic
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const handleSaveSettings = () => {
    // TODO: Implement save settings logic
    console.log('Saving settings:', settings);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full mx-auto px-2    h-full ">
          {/* Header */}
         

          <Card className="shadow-xl rounded-3xl border border-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full mt-8">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 gap-6 h-full">
                {/* Sidebar Navigation (now inside the single card) */}
                <div className="border-b border-gray-200">
                  <nav className="grid grid-cols-2 gap-2 p-2 md:flex md:flex-row md:gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full md:w-auto flex items-center justify-start px-3 md:px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 group ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:scale-102'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mr-2 md:mr-3 transition-transform duration-200 ${
                            activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                          }`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Main Content (now inside the same card) */}
                <div className="pt-4">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="shadow-inner border border-gray-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white w-full rounded-t-xl relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center absolute top-3 left-3 md:relative md:top-auto md:left-auto flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="ml-14 md:ml-0">
                            <h2 className="text-lg md:text-xl font-semibold leading-tight">Profile Information</h2>
                            <p className="text-blue-100 text-xs md:text-sm">Manage your personal details</p>
                          </div>
                        </div>
                        <Button
                          variant={isEditing ? "outline" : "primary"}
                          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                          className={`absolute top-3 right-3 md:relative md:top-auto md:right-auto ${
                            isEditing 
                              ? 'bg-white text-blue-600 hover:bg-blue-50 border-white' 
                              : 'bg-white/20 text-white hover:bg-white/30 border-white/30'
                          } text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2`}
                        >
                          {isEditing ? (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Avatar Section */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-100 dark:border-gray-600">
                            <div className="relative">
                              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-lg">
                                {profileData.name.charAt(0).toUpperCase()}
                              </div>
                              {isEditing && (
                                <button className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                                  <Camera className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profileData.name}</h3>
                              <p className="text-gray-600 dark:text-gray-300">{profileData.email}</p>
                              <Badge variant="info" className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                                {profileData.role}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <User className="w-4 h-4 mr-2 text-blue-600" />
                            Full Name
                          </label>
                          <Input
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Enter your full name"
                            className={`transition-all duration-200 ${
                              isEditing 
                                ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'bg-gray-50'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-blue-600" />
                            Email Address
                          </label>
                          <Input
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            disabled={!isEditing}
                            type="email"
                            placeholder="Enter your email"
                            className={`transition-all duration-200 ${
                              isEditing 
                                ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'bg-gray-50'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-blue-600" />
                            Phone Number
                          </label>
                          <Input
                            value={profileData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Enter your phone number"
                            className={`transition-all duration-200 ${
                              isEditing 
                                ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'bg-gray-50'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                            Location
                          </label>
                          <Input
                            value={profileData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Enter your location"
                            className={`transition-all duration-200 ${
                              isEditing 
                                ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                                : 'bg-gray-50'
                            }`}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </label>
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            disabled={!isEditing}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                            placeholder="Tell us about yourself..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <UserCheck className="w-4 h-4 inline mr-2" />
                            Role
                          </label>
                          <Input
                            value={profileData.role}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Join Date
                          </label>
                          <Input
                            value={profileData.joinDate}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="shadow-inner border-0 bg-white/90 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Account Security</h2>
                          <p className="text-red-100 text-sm">Protect your account with strong security</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter current password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <Input
                            type="password"
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                          />
                        </div>

                        <Button className="w-full">
                          <Key className="w-4 h-4 mr-2" />
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Two-Factor Authentication</h2>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">SMS Authentication</h3>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 h-full">
                  <div className="shadow-inner border-0 bg-white/90 backdrop-blur-sm overflow-hidden h-full rounded-xl">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Notification Preferences</h2>
                          <p className="text-green-100 text-sm">Customize how you receive notifications</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-green-600" />
                              Email Notifications
                            </h3>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email}
                              onChange={(e) => handleSettingsChange('notifications', 'email', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-teal-600 shadow-lg"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.push}
                              onChange={(e) => handleSettingsChange('notifications', 'push', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Task Updates</h3>
                            <p className="text-sm text-gray-600">Get notified about task changes</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.tasks}
                              onChange={(e) => handleSettingsChange('notifications', 'tasks', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Project Updates</h3>
                            <p className="text-sm text-gray-600">Get notified about project changes</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.projects}
                              onChange={(e) => handleSettingsChange('notifications', 'projects', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Team Updates</h3>
                            <p className="text-sm text-gray-600">Get notified about team changes</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.teams}
                              onChange={(e) => handleSettingsChange('notifications', 'teams', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance Settings</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Theme
                          </label>
                          <Select
                            value={theme}
                            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
                            options={[
                              { value: 'light', label: 'Light' },
                              { value: 'dark', label: 'Dark' }
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <Select
                            value={settings.language}
                            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                            options={[
                              { value: 'en', label: 'English' },
                              { value: 'es', label: 'Spanish' },
                              { value: 'fr', label: 'French' },
                              { value: 'de', label: 'German' }
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <Select
                            value={settings.timezone}
                            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                            options={[
                              { value: 'UTC', label: 'UTC' },
                              { value: 'EST', label: 'Eastern Time' },
                              { value: 'PST', label: 'Pacific Time' },
                              { value: 'GMT', label: 'Greenwich Mean Time' }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Visibility
                          </label>
                          <Select
                            value={settings.privacy.profileVisibility}
                            onChange={(value) => handleSettingsChange('privacy', 'profileVisibility', value)}
                            options={[
                              { value: 'public', label: 'Public' },
                              { value: 'team', label: 'Team Only' },
                              { value: 'private', label: 'Private' }
                            ]}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Show Email</h3>
                            <p className="text-sm text-gray-600">Allow others to see your email address</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy.showEmail}
                              onChange={(e) => handleSettingsChange('privacy', 'showEmail', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Show Phone</h3>
                            <p className="text-sm text-gray-600">Allow others to see your phone number</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy.showPhone}
                              onChange={(e) => handleSettingsChange('privacy', 'showPhone', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Show Location</h3>
                            <p className="text-sm text-gray-600">Allow others to see your location</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy.showLocation}
                              onChange={(e) => handleSettingsChange('privacy', 'showLocation', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">System Information</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">App Version</span>
                            <span className="text-sm text-gray-600">v1.0.0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Last Updated</span>
                            <span className="text-sm text-gray-600">2024-01-15</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Database</span>
                            <span className="text-sm text-gray-600">DynamoDB</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">API Status</span>
                            <Badge variant="success">Online</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Sync Status</span>
                            <Badge variant="info">Synced</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Storage Used</span>
                            <span className="text-sm text-gray-600">2.3 GB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200">
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
                      
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Database className="w-4 h-4 mr-2" />
                          Export Data
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Globe className="w-4 h-4 mr-2" />
                          Clear Cache
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                          <Lock className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
