"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { Calendar, Save, Trash2, Edit3, BookOpen, Image as ImageIcon, X, Upload, Eye, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import NextImage from "next/image";
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
  const textareaRef = useRef(null);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef("");
  const lastSavedImageUrlRef = useRef("");
  const uploadPromiseRef = useRef(null);
  
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
      lastSavedImageUrlRef.current = entry.image_url || "";
      setLastSavedAt(new Date(entry.updated_at));
      setHasUnsavedChanges(false);
      setIsEditMode(false); // Start in read-only mode for existing entries
    } else {
      setCurrentEntry("");
      setCurrentImageUrl("");
      setIsEditing(false);
      lastSavedContentRef.current = "";
      lastSavedImageUrlRef.current = "";
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

  // Compress and resize image
  const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if larger than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob (JPEG format for better compression)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!user || !file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Show immediate preview using FileReader
    const previewReader = new FileReader();
    previewReader.onload = (e) => {
      setCurrentImageUrl(e.target.result);
      setHasUnsavedChanges(true); // Mark as unsaved immediately
    };
    previewReader.readAsDataURL(file);

    setUploading(true);
    
    // Create upload promise and store it
    const uploadPromise = (async () => {
      try {
        // Compress image before upload
        let compressedFile = await compressImage(file);
        
        // Validate compressed file size (max 2MB after compression)
        if (compressedFile.size > 2 * 1024 * 1024) {
          // If still too large, compress more aggressively
          const moreCompressed = await compressImage(file, 1280, 0.75);
          if (moreCompressed.size > 2 * 1024 * 1024) {
            toast.error("Image is too large. Please choose a smaller image.");
            setCurrentImageUrl("");
            setUploading(false);
            uploadPromiseRef.current = null;
            return null;
          }
          compressedFile = moreCompressed;
        }

        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('journal-images')
          .upload(fileName, compressedFile, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('journal-images')
          .getPublicUrl(fileName);

        // Update with actual URL from storage
        setCurrentImageUrl(publicUrl);
        return publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error("Failed to upload image. Please try again.");
        setCurrentImageUrl("");
        throw error;
      } finally {
        setUploading(false);
        uploadPromiseRef.current = null;
      }
    })();
    
    uploadPromiseRef.current = uploadPromise;
    
    // Don't await - let it run in background
    uploadPromise.then((url) => {
      if (url) {
        toast.success("Image uploaded successfully");
      }
    }).catch(() => {
      // Error already handled in the promise
    });
  };

  // Remove image
  const removeImage = () => {
    setCurrentImageUrl("");
    setCurrentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Mark as having unsaved changes if there was an image before
    if (lastSavedImageUrlRef.current) {
      setHasUnsavedChanges(true);
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

  // Save journal entry (manual save only)
  const saveEntry = useCallback(async () => {
    if (!user) return;

    // Don't save if there's nothing to save
    if (!currentEntry.trim() && !currentImageUrl) {
      setSaveStatus("idle");
      return;
    }

    setSaveStatus("saving");
    
    try {
      // If image is still uploading (data URL), wait for upload to complete
      let finalImageUrl = currentImageUrl;
      if (currentImageUrl && currentImageUrl.startsWith('data:') && uploadPromiseRef.current) {
        try {
          finalImageUrl = await uploadPromiseRef.current;
        } catch (error) {
          // If upload failed, save without image or with data URL
          console.warn('Image upload not completed, saving with preview URL');
        }
      }
      
      const entryData = {
        user_id: user.id,
        date: selectedDate,
        content: currentEntry.trim(),
        image_url: finalImageUrl || null,
        image_alt: finalImageUrl ? `Journal image for ${selectedDate}` : null,
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
      lastSavedImageUrlRef.current = currentImageUrl || "";
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      
      // Exit edit mode after saving
      setIsEditMode(false);
      toast.success("Entry saved successfully!");
      
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

  // Track unsaved changes (no auto-save - manual save only)
  useEffect(() => {
    // Only track changes when in edit mode
    if (!isEditMode) return;
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check if both content and image are unchanged
    const textChanged = currentEntry.trim() !== lastSavedContentRef.current;
    const imageChanged = currentImageUrl !== lastSavedImageUrlRef.current;
    
    if (textChanged || imageChanged) {
      // Mark as having unsaved changes if there's something to save
      if (currentEntry.trim() || currentImageUrl) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
    } else {
      setHasUnsavedChanges(false);
    }
  }, [currentEntry, currentImageUrl, isEditMode]);

  // Handle keyboard shortcuts (only in edit mode)
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (currentEntry.trim() || currentImageUrl) {
          saveEntry();
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

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isEditMode]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Your Thoughts</h1>
              <p className="text-slate-400 text-sm sm:text-base">
                Capture your thoughts, memories, and experiences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Writing Area */}
          <div className="xl:col-span-3">
            <div data-main-editor className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-xl overflow-hidden">
              {/* Header Bar */}
              <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-end">
                <div className="flex items-center gap-2">
                  {!isEditMode && isEditing && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-2 text-sm font-medium"
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
                          className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all flex items-center justify-center"
                          title="Delete Entry"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (hasUnsavedChanges) {
                            saveEntry();
                          } else {
                            setIsEditMode(false);
                          }
                        }}
                        disabled={(!currentEntry.trim() && !currentImageUrl) || saveStatus === "saving"}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm font-medium"
                        title={hasUnsavedChanges ? "Save Entry (Ctrl+S)" : (isEditing && (currentEntry.trim() || currentImageUrl) ? "Done" : "Save Entry")}
                      >
                        {saveStatus === "saving" ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : hasUnsavedChanges ? (
                          <>
                            <Save size={16} />
                            <span>Save</span>
                          </>
                        ) : (isEditing && (currentEntry.trim() || currentImageUrl)) ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Date Picker - Compact */}
              <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/30" data-tour="journal-date-picker">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <div className="flex-1 cursor-pointer" data-tour="journal-date-picker">
                    <DatePickerInput
                      value={dayjs(selectedDate).toDate()}
                      onChange={(date) => date && setSelectedDate(dayjs(date).format("YYYY-MM-DD"))}
                      valueFormat="MMMM D, YYYY"
                      maxDate={dayjs().toDate()}
                      placeholder="Select a date"
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
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: dotColor,
                                  boxShadow: `0 0 4px ${dotColor}60`
                                }}
                              />
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 rounded-md bg-indigo-500/20 border border-indigo-400/50"></div>
                            )}
                          </div>
                        );
                      }}
                      popoverProps={{
                        withinPortal: true,
                        styles: { 
                          dropdown: { 
                            backgroundColor: "rgb(15 23 42 / 0.98)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgb(51 65 85 / 0.5)",
                            borderRadius: "12px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
                          } 
                        },
                      }}
                      styles={{
                        input: {
                          backgroundColor: "transparent",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "14px",
                          padding: "0",
                          fontWeight: "500",
                          cursor: "pointer",
                          "&:hover": {
                            color: "rgb(129 140 248)"
                          },
                          "&:focus": {
                            border: "none",
                            boxShadow: "none",
                            color: "rgb(129 140 248)"
                          }
                        },
                        day: { 
                          color: "#fff",
                          borderRadius: "6px",
                          "&:hover": {
                            backgroundColor: "rgb(99 102 241 / 0.2)"
                          },
                          "&[data-selected]": {
                            backgroundColor: "rgb(99 102 241 / 0.3)",
                            color: "#fff"
                          }
                        },
                        weekday: {
                          color: "rgb(148 163 184)"
                        },
                        calendarHeader: {
                          color: "#fff"
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section - Only show in edit mode */}
              {isEditMode && (
                <div className="px-6 py-4 border-b border-slate-800/50" data-tour="journal-image">
                  {currentImageUrl ? (
                    <div className="relative group">
                      <div className="relative w-full min-h-32 max-h-64 rounded-xl overflow-hidden bg-slate-800/50 flex items-center justify-center">
                        <NextImage
                          src={currentImageUrl}
                          alt="Journal image"
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-64 object-contain rounded-xl"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button
                            onClick={() => setShowImagePreview(true)}
                            className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={removeImage}
                            className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
                          <p className="text-xs text-slate-400 group-hover:text-indigo-300 transition-colors">
                            Add photo
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
                <div className="px-6 py-4 border-b border-slate-800/50">
                  <div className="relative w-full min-h-32 max-h-64 rounded-xl overflow-hidden bg-slate-800/50 flex items-center justify-center">
                    <NextImage
                      src={currentImageUrl}
                      alt="Journal image"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-64 object-contain rounded-xl"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Writing Area */}
              <div className="px-6 py-6">
                {/* Save Status Indicator */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

                {/* Read-only view */}
                {!isEditMode && currentEntry.trim() && (
                  <div 
                    className="w-full min-h-[400px] px-6 py-6 bg-slate-800/30 border border-slate-800/50 rounded-xl cursor-text hover:border-slate-700/70 transition-colors group"
                    onClick={() => setIsEditMode(true)}
                  >
                    <div className="text-white text-base leading-relaxed whitespace-pre-wrap font-light">
                      {currentEntry || <span className="text-slate-400 italic">No content</span>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Click anywhere to edit</span>
                    </div>
                  </div>
                )}

                {/* Edit mode textarea */}
                {isEditMode && (
                  <textarea
                    ref={textareaRef}
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder={
                      currentEntry.trim() === "" 
                        ? "What's on your mind today?\n\nShare your thoughts, experiences, or anything you'd like to remember..."
                        : "Keep writing..."
                    }
                    className="w-full min-h-[400px] px-6 py-6 bg-slate-800/30 border border-indigo-500/30 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none text-base leading-relaxed transition-all font-light"
                    data-tour="journal-editor"
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
                  <div className="w-full min-h-[400px] px-6 py-6 bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center hover:border-indigo-500/50 transition-colors">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                        <Edit3 className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Start your journal entry</h3>
                      <p className="text-slate-400 mb-6 text-sm">Capture your thoughts and memories for this day</p>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/30 font-medium flex items-center gap-2 mx-auto"
                      >
                        <Edit3 size={18} />
                        <span>Start writing</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats footer */}
                <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>{getWordCount(currentEntry)} words</span>
                    <span className="text-slate-700">•</span>
                    <span>{currentEntry.length} characters</span>
                  </div>
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Press</span>
                      <kbd className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-xs font-mono text-slate-300">
                        Ctrl+S
                      </kbd>
                      <span className="text-slate-600">to save</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Recent Entries */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800/50 shadow-xl p-5" data-tour="journal-sidebar">
              <h3 className="text-base font-semibold text-white mb-4">Recent Entries</h3>
              
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm mb-1">No entries yet</p>
                  <p className="text-slate-500 text-xs mb-4">Start writing your first entry!</p>
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
                <div className="space-y-2">
                  {entries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => openReadOnlyModal(entry)}
                      className={`p-3 rounded-lg border transition-all group cursor-pointer ${
                        entry.date === selectedDate
                          ? "bg-indigo-500/20 border-indigo-500/50"
                          : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-700/70"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white">
                          {dayjs(entry.date).format("MMM D")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {entry.image_url && (
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReadOnlyModal(entry);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="View Entry"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEntryById(entry.id, entry.date);
                            }}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-1.5 leading-relaxed">
                        {entry.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {dayjs(entry.updated_at).format("h:mm A")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(entry.date);
                            setIsEditMode(true);
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
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800/50 shadow-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">Your Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <span className="text-sm text-slate-300">Total Entries</span>
                  <span className="text-xl font-bold text-indigo-400">{entries.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <span className="text-sm text-slate-300">This Month</span>
                  <span className="text-lg font-semibold text-white">
                    {entries.filter(e => dayjs(e.date).isSame(dayjs(), 'month')).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <span className="text-sm text-slate-300">This Week</span>
                  <span className="text-lg font-semibold text-white">
                    {entries.filter(e => dayjs(e.date).isSame(dayjs(), 'week')).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {showImagePreview && currentImageUrl && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowImagePreview(false)}>
            <div className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>
              <NextImage
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
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={closeReadOnlyModal}>
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {dayjs(selectedReadOnlyEntry.date).format("MMMM D, YYYY")}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Updated {dayjs(selectedReadOnlyEntry.updated_at).fromNow()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeReadOnlyModal}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {selectedReadOnlyEntry.image_url && (
                  <div className="mb-6">
                    <div className="relative w-full rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                      <div className="relative w-full min-h-48 max-h-96 rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center">
                        <NextImage
                          src={selectedReadOnlyEntry.image_url}
                          alt={selectedReadOnlyEntry.image_alt || "Journal image"}
                          width={800}
                          height={600}
                          className="w-full h-auto max-h-96 object-contain rounded-xl"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-slate-800/30 rounded-xl border border-slate-800/50 p-6">
                  <div className="text-white text-base leading-relaxed whitespace-pre-wrap font-light">
                    {selectedReadOnlyEntry.content || <span className="text-slate-400 italic">No content</span>}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{selectedReadOnlyEntry.content.length} characters</span>
                    {selectedReadOnlyEntry.image_url && (
                      <>
                        <span className="text-slate-700">•</span>
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-indigo-400">With image</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 border border-red-500/30 text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDate(selectedReadOnlyEntry.date);
                        setIsEditMode(true);
                        closeReadOnlyModal();
                        setTimeout(() => {
                          const mainArea = document.querySelector('[data-main-editor]');
                          if (mainArea) {
                            mainArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 text-sm font-medium"
                    >
                      <Edit3 size={16} />
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
