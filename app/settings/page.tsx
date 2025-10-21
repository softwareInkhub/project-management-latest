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
  EyeOff,
  Check,
  AlertCircle,
  Monitor,
  Moon,
  Sun,
  CheckSquare,
  FolderKanban,
  Users
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/AppLayout';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
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

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving profile:', profileData);
    setIsEditing(false);
    setIsLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving settings:', settings);
    setIsLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
      <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="w-full h-full px-0 py-0">
          {/* Success Message */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Settings saved successfully!</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 h-full">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-2 h-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage your account preferences</p>
                </div>
                <nav className="p-3 flex-1 flex flex-col">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-left text-sm font-semibold rounded-lg transition-all duration-200 group mb-2 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 text-blue-900 dark:text-white shadow-md border border-blue-200 dark:border-gray-600'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md'
                            : 'bg-gray-100 dark:bg-gray-600 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:shadow-md'
                        }`}>
                          <Icon className={`w-4 h-4 transition-colors duration-200 ${
                            isActive 
                              ? 'text-white' 
                              : 'text-gray-700 dark:text-gray-300 group-hover:text-white'
                          }`} />
                        </div>
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-10 h-full overflow-y-auto">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-3 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-black">Profile Information</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Manage your personal details and preferences</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : isEditing ? (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex-1 flex flex-col">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-4 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                          {profileData.name.charAt(0).toUpperCase()}
                        </div>
                        {isEditing && (
                          <button className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white">
                            <Camera className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{profileData.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2 flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-2" />
                          {profileData.email}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-2 py-1 text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {profileData.role}
                          </Badge>
                          <Badge variant="default" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-2 py-1 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                          <Badge variant="default" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-2 py-1 text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined: {profileData.joinDate}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 gap-y-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
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
                              ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 hover:border-blue-400' 
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-green-600" />
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
                              ? 'focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300 hover:border-green-400' 
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-purple-600" />
                          Phone Number
                        </label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Enter your phone number"
                          className={`transition-all duration-200 ${
                            isEditing 
                              ? 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-gray-300 hover:border-purple-400' 
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                          Location
                        </label>
                        <Input
                          value={profileData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Enter your location"
                          className={`transition-all duration-200 ${
                            isEditing 
                              ? 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500 border-gray-300 hover:border-orange-400' 
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        />
                      </div>



                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                          Bio
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          disabled={!isEditing}
                          rows={4}
                          className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 resize-none ${
                            isEditing 
                              ? 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 hover:border-indigo-400 bg-white' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                          } dark:bg-gray-800 text-gray-900 dark:text-white`}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Security</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Protect your account with strong security settings</p>
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <Key className="w-5 h-5 mr-2 text-red-600" />
                          Change Password
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Update your password to keep your account secure</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Lock className="w-4 h-4 mr-2 text-red-600" />
                          Current Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Key className="w-4 h-4 mr-2 text-orange-600" />
                          New Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-green-600" />
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 px-8"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-purple-600" />
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20 shadow-md hover:shadow-lg transition-all duration-200">
                        Enable
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Customize how you receive notifications</p>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-3">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Receive notifications via email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.email}
                            onChange={(e) => handleSettingsChange('notifications', 'email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      {/* Push Notifications */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                            <Bell className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in browser</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.push}
                            onChange={(e) => handleSettingsChange('notifications', 'push', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      {/* Task Updates */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                            <CheckSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Task Updates</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about task changes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.tasks}
                            onChange={(e) => handleSettingsChange('notifications', 'tasks', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      {/* Project Updates */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                            <FolderKanban className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Project Updates</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about project changes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.projects}
                            onChange={(e) => handleSettingsChange('notifications', 'projects', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      {/* Team Updates */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Team Updates</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about team changes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.teams}
                            onChange={(e) => handleSettingsChange('notifications', 'teams', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Palette className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance Settings</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Customize the look and feel of your interface</p>
                      </div>
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme Preference</h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${
                          theme === 'light'
                            ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-400'}`} />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Light</span>
                      </button>

                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${
                          theme === 'dark'
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}`} />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Dark</span>
                      </button>

                    </div>
                  </div>

                  {/* Language & Timezone */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Localization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Control what information is visible to others</p>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Controls */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Show Email</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Allow others to see your email address</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showEmail}
                            onChange={(e) => handleSettingsChange('privacy', 'showEmail', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Show Phone</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Allow others to see your phone number</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showPhone}
                            onChange={(e) => handleSettingsChange('privacy', 'showPhone', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Show Location</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Allow others to see your location</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showLocation}
                            onChange={(e) => handleSettingsChange('privacy', 'showLocation', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-gray-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <SettingsIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Information</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">View system status and manage your data</p>
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-indigo-600" />
                      System Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">App Version</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">v1.0.0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">2024-01-15</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">DynamoDB</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Status</span>
                          <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Status</span>
                          <Badge variant="info" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Synced</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Used</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">2.3 GB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-blue-600" />
                      Data Management
                    </h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 shadow-md hover:shadow-lg transition-all duration-200">
                        <Database className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 shadow-md hover:shadow-lg transition-all duration-200">
                        <Globe className="w-4 h-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 shadow-md hover:shadow-lg transition-all duration-200">
                        <Lock className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
