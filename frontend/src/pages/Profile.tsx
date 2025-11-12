/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025-9-14, 2025-9-25, 2025-10-15, 2025-11-09
Scope: 
- Generated initial code
- Constant changing the UI to fit the endpoints (user endpoint)
- Writing frontend code based on iterated changes
- Debugging 
Author review: 
- Verfied for correctness by reading code
- Tested using local 
*/


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

// Define a type for a single question attempt for better type safety
interface QuestionAttempt {
  _id: string;
  QuestionTitle: string;
  Difficulty: string;
  Categories: string[];
  AttemptedAt: string; // Keep as string for initial fetch
}

// Define the shape of the data being edited
interface EditableProfileData {
  username: string;
  biography: string;
  handles: string[];
}

const ProfilePage: FC = () => {
  const { user } = useAuth();

  // --- State Management ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // This variable intelligently decides which username to display
  const displayName = profile?.username || user?.username || '';

  // State to hold form data while editing
  const [editableData, setEditableData] = useState<EditableProfileData>({
    username: '',
    biography: '',
    handles: [],
  });

  // --- Data Fetching ---
  const fetchProfile = useCallback(async (userId: string) => {
    setStatus('loading');
    try {
      const profileResponse = await apiClient.get<{ data: UserProfile }>(`/users/api/v1/users/${userId}/profile`);
      const profileData = profileResponse.data.data;

      if (!profileData) {
        throw new Error("Profile data is missing in the API response.");
      }

      setProfile(profileData);

      // Initialize the editable data with fetched profile info
      setEditableData({
        username: profileData.username || user?.username || '',
        biography: profileData.biography || '',
        handles: profileData.handles || [],
      });
      setStatus('success');
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setStatus('error');
    }
  }, [user?.username]); // Depend on user.username to re-initialize form if context changes

  // Main effect to fetch all necessary data
  useEffect(() => {
    if (user?.id) {
      // Fetch the main user profile
      fetchProfile(user.id);

      // Fetch the question attempts history
      apiClient.get<QuestionAttempt[]>(`/questions/question/attempt/${user.id}`)
        .then(res => {
          setAttempts(res.data);
        })
        .catch(err => {
          console.error("Failed to fetch question attempts:", err);
          // You could set a separate error state for attempts if needed
        });
    }
  }, [user?.id, fetchProfile]);

  // --- Event Handlers ---

  const handleEditToggle = () => {
    if (!isEditing && profile) {
      setEditableData({
        username: profile.username || user?.username || '',
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
      const payload: UpdateProfilePayload = {
        username: editableData.username,
        biography: editableData.biography,
        handles: editableData.handles.filter(handle => handle && handle.trim() !== ''),
      };

      const response = await apiClient.put<{ data: UserProfile }>(`/users/api/v1/users/${user.id}/profile`, payload);

      setProfile(response.data.data);
      setIsEditing(false);

    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Dynamic Form 'handles' Handlers ---

  const handleHandleChange = (index: number, value: string) => {
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
                  {isSaving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleEditToggle}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
        </div>

        {/* Profile Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 border rounded-lg bg-white">
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-4xl font-semibold text-gray-500">
                {getInitials(displayName || 'U')}
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
              <p className="text-gray-500">{user!.email}</p>
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
            <p>Questions: {attempts?.length ?? 0}</p>
            <p>Member since: {profile ? new Date(profile.createdAt).toLocaleDateString() : '...'}</p>
          </div>
        </div>

        {/* --- NEW: Attempt History Section --- */}
        <div className="p-6 border rounded-lg bg-white">
          <h2 className="text-2xl font-bold mb-4">Question Attempts</h2>
          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b p-2">Question</th>
                    <th className="border-b p-2">Difficulty</th>
                    <th className="border-b p-2">Categories</th>
                    <th className="border-b p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(a => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="border-b p-2">{a.QuestionTitle}</td>
                      <td className="border-b p-2">{a.Difficulty}</td>
                      <td className="border-b p-2">{a.Categories.join(', ')}</td>
                      <td className="border-b p-2">{new Date(a.AttemptedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No question attempts recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfilePageSkeleton: FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl space-y-12">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        {/* Profile Details Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 border rounded-lg bg-white">
          <div className="md:col-span-1 flex flex-col items-center text-center space-y-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-5 w-48 rounded-md" />
          </div>
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* User Statistics Skeleton */}
        <div className="p-6 border rounded-lg bg-white">
          <Skeleton className="h-8 w-56 mb-6 rounded-md" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
          </div>
        </div>

        {/* --- NEW: Attempts Table Skeleton --- */}
        <div className="p-6 border rounded-lg bg-white">
          <Skeleton className="h-8 w-64 mb-6 rounded-md" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;