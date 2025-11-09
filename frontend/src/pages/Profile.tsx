// src/pages/ProfilePage.tsx

import { type FC, useState, useEffect, useCallback } from 'react';
import { Pencil, PlusCircle, XCircle, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from '@/api/apiClient'; 
import { type UserProfile, type UpdateProfilePayload } from '@/types'; 

// Define the shape of the data being edited
interface EditableProfileData {
  username: string;
  biography: string;
  handles: string[];
}

const ProfilePage: FC = () => {
  const { user } = useAuth();  
  const [attempts, setAttempts] = useState<any[]>([]);

  // --- State Management ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const displayName = profile?.username || user?.username || '';

  // State to hold form data while editing, now strongly typed
  const [editableData, setEditableData] = useState<EditableProfileData>({
    username: '',
    biography: '',
    handles: [],
  });

  // --- Data Fetching ---
  const fetchProfile = useCallback(async (userId: string) => {
    setStatus('loading');
    try {
      // 
      const response = await apiClient.get<{ data: UserProfile }>(`/users/api/v1/users/${userId}/profile`);
      const profileData = response.data.data;

      if (!profileData) {
        throw new Error("Profile data is missing in the API response.");
      }


      setProfile(profileData);
      
      // Initialize the editable data with fetched profile info
      setEditableData({
        username: profileData.username || user?.username || '', // Add this
        biography: profileData.biography || '',
        // Ensure handles is always an array, even if null/undefined from API
        handles: profileData.handles || [], 
      });
      setStatus('success');
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // --- Event Handlers ---

  const handleEditToggle = () => {
    // If we are entering edit mode, sync the form with the latest profile data
    if (!isEditing && profile) {
      setEditableData({
        username: profile.username || user?.username || '', // Add this
        biography: profile.biography || '',
        handles: [...(profile.handles || [])],
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveClick = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Filter out any empty handles and create the payload
      const payload: UpdateProfilePayload = {
        username: editableData.username,
        biography: editableData.biography,
        handles: editableData.handles.filter(handle => handle && handle.trim() !== ''),
      };

      const response = await apiClient.put<{ data: UserProfile }>(`/users/api/v1/users/${user.id}/profile`, payload);
      
      // Update local state with the definitive data from the server
      setProfile(response.data.data);
      setIsEditing(false);
      // Optionally: Show a success toast notification here
      
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Optionally: Show an error toast notification here
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- Dynamic Form 'handles' Handlers ---

  const handleHandleChange = (index: number, value: string) => {
    // Create a new array to ensure state immutability
    const newHandles = [...editableData.handles];
    newHandles[index] = value;
    setEditableData(prev => ({ ...prev, handles: newHandles }));
  };

  const addHandleInput = () => {
    setEditableData(prev => ({ ...prev, handles: [...prev.handles, ''] }));
  };

  const removeHandleInput = (index: number) => {
    const newHandles = editableData.handles.filter((_, i) => i !== index);
    setEditableData(prev => ({ ...prev, handles: newHandles }));
  };

  // Helper for avatar initials
  const getInitials = (name: string) => {
    return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // --- Render Logic ---

  if (status === 'loading') {
    return <ProfilePageSkeleton />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600">Failed to load profile</h2>
          <p className="text-gray-500">Please try again later.</p>
          <Button onClick={() => user?.id && fetchProfile(user.id)} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl space-y-12">
        {/* Profile Header */}
        <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">My Profile</h1>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={isSaving}>
                  {isSaving ? 'Saving...' : <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleEditToggle}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
        </div>
        
        {/* Profile Details Section (JSX remains largely the same) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 border rounded-lg bg-white">
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">

              <span className="text-4xl font-semibold text-gray-500">
                {getInitials(user!.username || 'U')} {/* Corrected to user.name */}
              </span>
            </div>
             {isEditing ? (
                <Input
                  value={editableData.username}
                  onChange={(e) => setEditableData(prev => ({ ...prev, username: e.target.value }))}
                  className="text-2xl font-bold text-center mt-2" 
                  disabled={isSaving}
                  placeholder="Enter your username"
                />
              ) : (
                <h2 className="text-2xl font-bold">{displayName}</h2>
              )}
              
              <p className="text-gry-500">{user!.email}</p>
            </div>


            
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Biography</h3>
              {isEditing ? (
                <Textarea
                  placeholder="Tell us a bit about yourself..."
                  value={editableData.biography}
                  onChange={(e) => setEditableData(prev => ({...prev, biography: e.target.value}))}
                  rows={4}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {profile?.biography || <span className="text-gray-400">No biography set.</span>}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Social Handles</h3>
              {isEditing ? (
                 <div className="space-y-2">
                    {editableData.handles.map((handle, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="url"
                          placeholder="https://github.com/username"
                          value={handle}
                          onChange={(e) => handleHandleChange(index, e.target.value)}
                          disabled={isSaving}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeHandleInput(index)} disabled={isSaving}>
                          <XCircle className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHandleInput} disabled={isSaving}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Handle
                    </Button>
                 </div>
              ) : (
                <ul className="space-y-2">
                  {profile?.handles && profile.handles.length > 0 ? (
                    profile.handles.map((handle, index) => (
                      <li key={index}>
                        <a href={handle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {handle}
                        </a>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-400">No social handles added.</p>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* User Statistics Section */}
        <div className="p-6 border rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-4">User Statistics</h2>
          <div className="text-gray-600 space-y-2">
            <p>Questions Completed: {profile?.problemsSolved?.length ?? 0}</p>
            <p>Member since: {profile ? new Date(profile.createdAt).toLocaleDateString() : '...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfilePageSkeleton: FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl space-y-12">
        {/* --- Header Skeleton --- */}
        <div className="flex justify-between items-start">
          {/* "My Profile" heading */}
          <Skeleton className="h-10 w-48 rounded-md" />
          {/* "Edit Profile" button */}
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        {/* --- Profile Details Section Skeleton --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 border rounded-lg bg-white">
          {/* Left Column: Avatar and basic info */}
          <div className="md:col-span-1 flex flex-col items-center text-center space-y-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md mt-2" />
          </div>

          {/* Right Column: Biography and Handles */}
          <div className="md:col-span-2 space-y-8">
            {/* Biography */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>

            {/* Social Handles */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* --- User Statistics Section Skeleton --- */}
        <div className="p-6 border rounded-lg bg-white">
          {/* "User Statistics" heading */}
          <Skeleton className="h-8 w-56 mb-6 rounded-md" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
          </div>
        </div>

        {/* <div>
          {attempts}
        </div> */}
        {/* Attempt history section */}
         <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Question Attempts</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Question</th>
                <th className="border p-2">Difficulty</th>
                <th className="border p-2"> Categories</th>
                <th className="border p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a._id}>
                  <td className="border p-2">{a.QuestionTitle}</td>
                  <td className="border p-2">{a.Difficulty}</td>
                  <td className="border p-2">{a.Categories.join(', ')}</td>
                  <td className="border p-2">{new Date(a.AttemptedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default ProfilePage;