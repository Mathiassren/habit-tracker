"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { Calendar, Save, Trash2, Edit3, BookOpen, Image as ImageIcon, X, Upload, Eye, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

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
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef("");
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

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
      lastSavedContentRef.current = entry.content;
      setLastSavedAt(new Date(entry.updated_at));
      setHasUnsavedChanges(false);
      setIsEditMode(false); // Start in read-only mode for existing entries
    } else {
      setCurrentEntry("");
      setCurrentImageUrl("");
      setIsEditing(false);
      lastSavedContentRef.current = "";
      setLastSavedAt(null);
      setHasUnsavedChanges(false);
      setIsEditMode(true); // Start in edit mode for new entries
    }
  };

  // Calculate word count
  const getWordCount = (text) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!user || !file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

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
      setHasUnsavedChanges(true);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image. Please try again.");
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

  // Save journal entry (with auto-save support)
  const saveEntry = useCallback(async (isAutoSave = false) => {
    if (!user) return;
    
    // Don't auto-save empty entries
    if (isAutoSave && !currentEntry.trim()) return;
    
    // Don't save if content hasn't changed
    if (isAutoSave && currentEntry.trim() === lastSavedContentRef.current) {
      return;
    }

    setSaveStatus("saving");
    
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
        setIsEditing(true);
      }

      await fetchEntries();
      lastSavedContentRef.current = currentEntry.trim();
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      
      // Exit edit mode after saving (unless it's an auto-save)
      if (!isAutoSave) {
        setIsEditMode(false);
        toast.success("Entry saved successfully!");
      }
      
      // Reset saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus((prev) => prev === "saved" ? "idle" : prev);
      }, 2000);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      setSaveStatus("error");
      toast.error("Failed to save entry. Please try again.");
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [user, currentEntry, selectedDate, currentImageUrl, isEditing]);

  // Auto-save with debouncing (only when in edit mode)
  useEffect(() => {
    // Only auto-save when in edit mode
    if (!isEditMode) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Don't auto-save if content hasn't changed
    if (currentEntry.trim() === lastSavedContentRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    // Mark as having unsaved changes
    if (currentEntry.trim()) {
      setHasUnsavedChanges(true);
    }

    // Auto-save after 2 seconds of inactivity
    if (currentEntry.trim()) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveEntry(true);
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentEntry, saveEntry, isEditMode]);

  // Handle keyboard shortcuts (only in edit mode)
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (currentEntry.trim()) {
          saveEntry(false);
        }
      }
      // Escape to exit edit mode (if no unsaved changes)
      if (e.key === "Escape" && !hasUnsavedChanges) {
        setIsEditMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentEntry, saveEntry, isEditMode, hasUnsavedChanges]);

  // Delete journal entry by date (for current entry)
  const deleteEntry = async () => {
    if (!user) return;

    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-white">Delete today's entry?</p>
          <p className="text-sm text-gray-300">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        style: {
          background: "#1e293b",
          color: "#fff",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        },
      });
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("date", selectedDate);

      if (error) throw error;

      setCurrentEntry("");
      setIsEditing(false);
      setIsEditMode(false);
      lastSavedContentRef.current = "";
      setHasUnsavedChanges(false);
      setLastSavedAt(null);
      await fetchEntries();
      toast.success("Entry deleted successfully");
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast.error("Failed to delete entry. Please try again.");
    }
  };

  // Delete journal entry by ID (for sidebar entries)
  const deleteEntryById = async (entryId, entryDate) => {
    if (!user) return;
    
    // Show confirmation toast instead of alert
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-white">Delete this entry?</p>
          <p className="text-sm text-gray-300">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        style: {
          background: "#1e293b",
          color: "#fff",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        },
      });
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("id", entryId);

      if (error) throw error;

      // If the deleted entry was the currently selected one, clear it
      if (entryDate === selectedDate) {
        setCurrentEntry("");
        setIsEditing(false);
        setIsEditMode(false);
        lastSavedContentRef.current = "";
        setHasUnsavedChanges(false);
      }

      await fetchEntries();
      toast.success("Entry deleted successfully");
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast.error("Failed to delete entry. Please try again.");
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

  // Create a map of dates with entries for calendar dots
  const entriesByDate = entries.reduce((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {});

  // Get dot color for a date based on entry properties
  const getDotColor = (dateStr) => {
    const entry = entriesByDate[dateStr];
    if (!entry) return null;
    
    // Different colors based on entry properties
    if (entry.image_url) {
      // Entry with image - vibrant cyan
      return "#06b6d4"; // cyan
    } else if (entry.content.length > 500) {
      // Long entry - emerald
      return "#10b981"; // emerald
    } else if (entry.content.length > 200) {
      // Medium entry - blue
      return "#3b82f6"; // blue
    } else {
      // Short entry - indigo
      return "#6366f1"; // indigo
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gradient-vibrant mb-2">Journal</h1>
                    <p className="text-slate-400 text-lg">
                      Capture your thoughts, memories, and experiences
                    </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Writing Area */}
          <div className="xl:col-span-3">
            <div data-main-editor className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 overflow-hidden">
              {/* Date Selector */}
              <div className="p-8 border-b border-white/10 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
                <div className="flex items-center gap-4 flex-wrap">
                  <Calendar className="w-6 h-6 text-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-white">Today's Entry</h2>
                    <p className="text-gray-400 text-sm">
                      {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}
                    </p>
                  </div>
                  <div className="w-full md:w-auto">
                    <DatePickerInput
                      value={dayjs(selectedDate).toDate()}
                      onChange={(date) => date && setSelectedDate(dayjs(date).format("YYYY-MM-DD"))}
                      valueFormat="MMMM D, YYYY"
                      maxDate={dayjs().toDate()}
                      renderDay={(date) => {
                        const dateStr = dayjs(date).format("YYYY-MM-DD");
                        const dotColor = getDotColor(dateStr);
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === dayjs().format("YYYY-MM-DD");
                        
                        return (
                          <div className="relative flex items-center justify-center w-full h-full">
                            <span className={`${isSelected ? 'text-white font-bold' : isToday ? 'text-indigo-400 font-semibold' : 'text-white'}`}>
                              {date.getDate()}
                            </span>
                            {dotColor && (
                              <div
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-lg"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 6px ${dotColor}40, 0 0 12px ${dotColor}20`
                                }}
                              />
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 rounded-md bg-indigo-500/20 border-2 border-indigo-400"></div>
                            )}
                          </div>
                        );
                      }}
                      popoverProps={{
                        withinPortal: true,
                        styles: { 
                          dropdown: { 
                            backgroundColor: "rgb(15 15 15 / 0.95)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgb(99 102 241 / 0.3)",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
                          } 
                        },
                      }}
                      styles={{
                        input: {
                          backgroundColor: "rgb(30 30 30 / 0.8)",
                          color: "#ffffff",
                          border: "1px solid rgb(99 102 241 / 0.3)",
                          borderRadius: "12px",
                          fontSize: "16px",
                          padding: "12px 16px",
                          backdropFilter: "blur(10px)",
                          "&:focus": {
                            borderColor: "rgb(99 102 241 / 0.6)",
                            boxShadow: "0 0 0 3px rgb(99 102 241 / 0.1)"
                          }
                        },
                        day: { 
                          color: "#fff",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: "rgb(99 102 241 / 0.2)"
                          },
                          "&[data-selected]": {
                            backgroundColor: "rgb(99 102 241 / 0.4)",
                            color: "#fff"
                          }
                        },
                        weekday: {
                          color: "rgb(99 102 241 / 0.8)"
                        },
                        calendarHeader: {
                          color: "#fff"
                        }
                      }}
                      className="w-full md:w-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section - Only show in edit mode */}
              {isEditMode && (
                <div className="p-8 border-b border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Add a Photo</h3>
                  </div>
                
                {currentImageUrl ? (
                  <div className="relative group">
                    <div className="relative w-full min-h-48 max-h-96 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
                      <Image
                        src={currentImageUrl}
                        alt="Journal image"
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-96 object-contain rounded-2xl"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
                    className="w-full h-48 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-colors group"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 group-hover:text-indigo-400 transition-colors mb-4" />
                        <p className="text-gray-400 group-hover:text-indigo-300 transition-colors">
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
              )}

              {/* Image Display - Read-only mode */}
              {!isEditMode && currentImageUrl && (
                <div className="p-8 border-b border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Photo</h3>
                  </div>
                  <div className="relative group">
                    <div className="relative w-full min-h-48 max-h-96 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
                      <Image
                        src={currentImageUrl}
                        alt="Journal image"
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-96 object-contain rounded-2xl"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Writing Area */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Your Thoughts</h3>
                      {/* Save Status Indicator */}
                      <div className="flex items-center gap-2 mt-1">
                        {saveStatus === "saving" && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                            <Loader2 size={12} className="animate-spin" />
                            <span>Saving...</span>
                          </div>
                        )}
                        {saveStatus === "saved" && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span>Saved</span>
                          </div>
                        )}
                        {saveStatus === "error" && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertCircle size={12} />
                            <span>Save failed</span>
                          </div>
                        )}
                        {hasUnsavedChanges && saveStatus === "idle" && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                            <span>Unsaved changes</span>
                          </div>
                        )}
                        {lastSavedAt && !hasUnsavedChanges && saveStatus === "idle" && (
                          <span className="text-xs text-slate-500">
                            Saved {dayjs(lastSavedAt).fromNow()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditMode && isEditing && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 text-sm font-medium"
                        title="Edit Entry"
                      >
                        <Edit3 size={16} />
                        <span>Edit</span>
                      </button>
                    )}
                    {isEditMode && (
                      <>
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
                          onClick={() => {
                            if (hasUnsavedChanges) {
                              saveEntry(false);
                            } else {
                              setIsEditMode(false);
                            }
                          }}
                          disabled={!currentEntry.trim() || uploading || saveStatus === "saving"}
                          className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 group"
                          title={hasUnsavedChanges ? (isEditing ? "Update Entry (Ctrl+S)" : "Save Entry (Ctrl+S)") : "Done"}
                        >
                          {saveStatus === "saving" ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : hasUnsavedChanges ? (
                            <Save size={18} className="group-hover:scale-110 transition-transform" />
                          ) : (
                            <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Read-only view */}
                {!isEditMode && currentEntry.trim() && (
                  <div className="w-full min-h-80 px-6 py-4 bg-gray-800/30 border border-gray-700/50 rounded-2xl backdrop-blur-sm">
                    <div className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                      {currentEntry || <span className="text-gray-400 italic">No content</span>}
                    </div>
                  </div>
                )}

                {/* Edit mode textarea */}
                {isEditMode && (
                  <textarea
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder={
                      currentEntry.trim() === "" 
                        ? "What's on your mind today? Share your thoughts, experiences, or anything you'd like to remember...\n\n💡 Tip: Your entry will auto-save as you type. Press Ctrl+S to save manually."
                        : "Keep writing... Your entry will auto-save as you type."
                    }
                    className="w-full h-80 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none resize-none backdrop-blur-sm text-lg leading-relaxed transition-colors"
                    onKeyDown={(e) => {
                      // Allow Tab for indentation
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        setCurrentEntry(
                          currentEntry.substring(0, start) +
                          "  " +
                          currentEntry.substring(end)
                        );
                        // Set cursor position after tab
                        setTimeout(() => {
                          e.target.selectionStart = e.target.selectionEnd = start + 2;
                        }, 0);
                      }
                    }}
                  />
                )}

                {/* Empty state when no entry and not in edit mode */}
                {!isEditMode && !currentEntry.trim() && (
                  <div className="w-full min-h-80 px-6 py-4 bg-gray-800/30 border border-gray-700/50 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No entry for this date</p>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
                      >
                        Start writing →
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats footer - only show in edit mode or when there's content */}
                {(isEditMode || currentEntry.trim()) && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>{getWordCount(currentEntry)} words</span>
                      <span className="text-gray-600">•</span>
                      <span>{currentEntry.length} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditMode && (
                        <>
                          <span className="text-xs text-gray-500">Press</span>
                          <kbd className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-xs font-mono text-gray-300">
                            Ctrl+S
                          </kbd>
                          <span className="text-xs text-gray-500">to save</span>
                          <span className="text-gray-600 mx-2">•</span>
                        </>
                      )}
                      <span className="text-indigo-400">
                        {dayjs(selectedDate).format("MMMM D, YYYY")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Entries */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl shadow-indigo-900/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Entries</h3>
              
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium mb-1">No entries yet</p>
                  <p className="text-gray-500 text-sm mb-4">Start writing your first entry!</p>
                  <button
                    onClick={() => {
                      setSelectedDate(dayjs().format("YYYY-MM-DD"));
                      setTimeout(() => {
                        const mainArea = document.querySelector('[data-main-editor]');
                        if (mainArea) {
                          mainArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Write today's entry →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => openReadOnlyModal(entry)}
                      className={`p-4 rounded-xl border transition-all group cursor-pointer ${
                        entry.date === selectedDate
                          ? "bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                          : "bg-slate-700/20 border-slate-600/30 hover:bg-slate-700/30 hover:border-slate-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {dayjs(entry.date).format("MMM D")}
                        </span>
                        <div className="flex items-center gap-2">
                          {entry.image_url && (
                            <ImageIcon className="w-4 h-4 text-indigo-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReadOnlyModal(entry);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg"
                            title="View Entry"
                          >
                            <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEntryById(entry.id, entry.date);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded-lg"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
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
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(entry.date);
                              setIsEditMode(true);
                              // Scroll to the main editing area
                              setTimeout(() => {
                                const mainArea = document.querySelector('[data-main-editor]');
                                if (mainArea) {
                                  mainArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-cyan-600/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {dayjs(selectedReadOnlyEntry.date).format("dddd, MMMM D, YYYY")}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Updated at {new Date(selectedReadOnlyEntry.updated_at).toLocaleTimeString(navigator.language || undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeReadOnlyModal}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600/50"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedReadOnlyEntry.image_url && (
                  <div className="mb-6">
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700/50 p-4">
                      <div className="relative w-full min-h-64 max-h-[500px] rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center">
                        <Image
                          src={selectedReadOnlyEntry.image_url}
                          alt={selectedReadOnlyEntry.image_alt || "Journal image"}
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-[500px] object-contain rounded-xl"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
                  <div className="text-white text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedReadOnlyEntry.content || <span className="text-slate-400 italic">No content</span>}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <span className="text-slate-300 font-medium">{selectedReadOnlyEntry.content.length}</span>
                      <span className="text-slate-500">characters</span>
                    </div>
                    {selectedReadOnlyEntry.image_url && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-400 font-medium">With image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={async () => {
                        const confirmed = await new Promise((resolve) => {
                          toast((t) => (
                            <div className="flex flex-col gap-3">
                              <p className="font-semibold text-white">Delete this entry?</p>
                              <p className="text-sm text-gray-300">This action cannot be undone.</p>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(true);
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => {
                                    toast.dismiss(t.id);
                                    resolve(false);
                                  }}
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ), {
                            duration: Infinity,
                            style: {
                              background: "#1e293b",
                              color: "#fff",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            },
                          });
                        });
                        
                        if (confirmed) {
                          await deleteEntryById(selectedReadOnlyEntry.id, selectedReadOnlyEntry.date);
                          closeReadOnlyModal();
                        }
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 border border-red-500/30 font-medium"
                    >
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(selectedReadOnlyEntry.date);
                        setIsEditMode(true);
                        closeReadOnlyModal();
                        // Scroll to the main editing area
                        setTimeout(() => {
                          const mainArea = document.querySelector('[data-main-editor]');
                          if (mainArea) {
                            mainArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 font-medium"
                    >
                      <Edit3 size={18} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
