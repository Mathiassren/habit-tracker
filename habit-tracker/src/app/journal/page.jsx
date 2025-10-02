"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { Calendar, Save, Trash2, Edit3, BookOpen, Image as ImageIcon, X, Upload, Eye } from "lucide-react";
import dayjs from "dayjs";
import Image from "next/image";

export default function JournalPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [currentEntry, setCurrentEntry] = useState("");
  const [currentImage, setCurrentImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);
  const [selectedReadOnlyEntry, setSelectedReadOnlyEntry] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch journal entries
  const fetchEntries = async () => {
    if (!user) return;
    
    setLoadingEntries(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching journal entries:", error);
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      console.error("Error fetching journal entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Load entry for selected date
  const loadEntryForDate = () => {
    const entry = entries.find(e => e.date === selectedDate);
    if (entry) {
      setCurrentEntry(entry.content);
      setCurrentImageUrl(entry.image_url || "");
      setIsEditing(true);
    } else {
      setCurrentEntry("");
      setCurrentImageUrl("");
      setIsEditing(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!user || !file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('journal-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('journal-images')
        .getPublicUrl(fileName);

      setCurrentImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setCurrentImageUrl("");
    setCurrentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open read-only modal
  const openReadOnlyModal = (entry) => {
    setSelectedReadOnlyEntry(entry);
    setShowReadOnlyModal(true);
  };

  // Close read-only modal
  const closeReadOnlyModal = () => {
    setShowReadOnlyModal(false);
    setSelectedReadOnlyEntry(null);
  };

  // Save journal entry
  const saveEntry = async () => {
    if (!user || !currentEntry.trim()) return;

    try {
      const entryData = {
        user_id: user.id,
        date: selectedDate,
        content: currentEntry.trim(),
        image_url: currentImageUrl || null,
        image_alt: currentImageUrl ? `Journal image for ${selectedDate}` : null,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update(entryData)
          .eq("user_id", user.id)
          .eq("date", selectedDate);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from("journal_entries")
          .insert(entryData);

        if (error) throw error;
      }

      await fetchEntries();
      setIsEditing(true);
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
  };

  // Delete journal entry
  const deleteEntry = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("date", selectedDate);

      if (error) throw error;

      setCurrentEntry("");
      setIsEditing(false);
      await fetchEntries();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
    }
  };

  // Initialize
  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  useEffect(() => {
    loadEntryForDate();
  }, [selectedDate, entries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Journal</h1>
            <p className="text-gray-400 text-lg">
              Capture your thoughts, memories, and experiences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Writing Area */}
          <div className="xl:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Date Selector */}
              <div className="p-8 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-purple-800/10">
                <div className="flex items-center gap-4">
                  <Calendar className="w-6 h-6 text-purple-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">Today's Entry</h2>
                    <p className="text-gray-400 text-sm">
                      {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none backdrop-blur-sm"
                      max={dayjs().format("YYYY-MM-DD")}
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Add a Photo</h3>
                </div>
                
                {currentImageUrl ? (
                  <div className="relative group">
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-800">
                      <Image
                        src={currentImageUrl}
                        alt="Journal image"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => setShowImagePreview(true)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={removeImage}
                          className="p-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-colors group"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 group-hover:text-purple-400 transition-colors mb-4" />
                        <p className="text-gray-400 group-hover:text-purple-300 transition-colors">
                          Click to upload an image
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCurrentImage(file);
                      handleImageUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Writing Area */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Your Thoughts</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <button
                        onClick={deleteEntry}
                        className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors backdrop-blur-sm group"
                        title="Delete Entry"
                      >
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    <button
                      onClick={saveEntry}
                      disabled={!currentEntry.trim() || uploading}
                      className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg group"
                      title={isEditing ? "Update Entry" : "Save Entry"}
                    >
                      <Save size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={currentEntry}
                  onChange={(e) => setCurrentEntry(e.target.value)}
                  placeholder="What's on your mind today? Share your thoughts, experiences, or anything you'd like to remember..."
                  className="w-full h-80 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none backdrop-blur-sm text-lg leading-relaxed"
                />

                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <span>{currentEntry.length} characters</span>
                  <span className="text-purple-400">
                    {dayjs(selectedDate).format("MMMM D, YYYY")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Entries */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Entries</h3>
              
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No entries yet</p>
                  <p className="text-gray-500 text-sm">Start writing your first entry!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-xl border transition-all group ${
                        entry.date === selectedDate
                          ? "bg-purple-500/20 border-purple-500/50 shadow-lg"
                          : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {dayjs(entry.date).format("MMM D")}
                        </span>
                        <div className="flex items-center gap-2">
                          {entry.image_url && (
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                          )}
                          <button
                            onClick={() => openReadOnlyModal(entry)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg"
                            title="View Entry"
                          >
                            <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {entry.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {dayjs(entry.updated_at).format("h:mm A")}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <button
                            onClick={() => setSelectedDate(entry.date)}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Your Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                  <span className="text-gray-300">Total Entries</span>
                  <span className="text-2xl font-bold text-purple-400">{entries.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                  <span className="text-gray-300">This Month</span>
                  <span className="text-xl font-semibold text-white">
                    {entries.filter(e => dayjs(e.date).isSame(dayjs(), 'month')).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                  <span className="text-gray-300">This Week</span>
                  <span className="text-xl font-semibold text-white">
                    {entries.filter(e => dayjs(e.date).isSame(dayjs(), 'week')).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {showImagePreview && currentImageUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X size={24} />
              </button>
              <Image
                src={currentImageUrl}
                alt="Journal image preview"
                width={800}
                height={600}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Read-Only Entry Modal */}
        {showReadOnlyModal && selectedReadOnlyEntry && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-purple-800/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {dayjs(selectedReadOnlyEntry.date).format("dddd, MMMM D, YYYY")}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {dayjs(selectedReadOnlyEntry.updated_at).format("h:mm A")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeReadOnlyModal}
                    className="p-2 bg-gray-800/50 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {selectedReadOnlyEntry.image_url && (
                  <div className="mb-6">
                    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gray-800">
                      <Image
                        src={selectedReadOnlyEntry.image_url}
                        alt={selectedReadOnlyEntry.image_alt || "Journal image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="prose prose-invert max-w-none">
                  <div className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedReadOnlyEntry.content}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{selectedReadOnlyEntry.content.length} characters</span>
                    {selectedReadOnlyEntry.image_url && (
                      <>
                        <span>•</span>
                        <span>With image</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDate(selectedReadOnlyEntry.date);
                      closeReadOnlyModal();
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
