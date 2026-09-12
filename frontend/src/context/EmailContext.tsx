import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { EmailItem, ScheduleEmailPayload } from '../types/email';
import { api } from '../services/api';

interface EmailContextType {
  scheduledEmails: EmailItem[];
  sentEmails: EmailItem[];
  activeTab: 'scheduled' | 'sent';
  setActiveTab: (tab: 'scheduled' | 'sent') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  selectedEmail: EmailItem | null;
  setSelectedEmail: (email: EmailItem | null) => void;
  isComposing: boolean;
  setIsComposing: (isComposing: boolean) => void;
  refreshEmails: () => Promise<void>;
  scheduleEmail: (payload: ScheduleEmailPayload) => Promise<EmailItem>;
  toggleStar: (id: string) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scheduledEmails, setScheduledEmails] = useState<EmailItem[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailItem[]>([]);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const refreshEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scheduled, sent] = await Promise.all([
        api.getScheduledEmails(),
        api.getSentEmails(),
      ]);
      setScheduledEmails(scheduled);
      setSentEmails(sent);
    } catch (error) {
      console.error('Failed to load emails', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEmails();
  }, [refreshEmails]);

  const scheduleEmail = async (payload: ScheduleEmailPayload): Promise<EmailItem> => {
    setIsLoading(true);
    try {
      const created = await api.scheduleEmail(payload);
      await refreshEmails();
      return created;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStar = (id: string) => {
    setScheduledEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isStarred: !e.isStarred } : e))
    );
    setSentEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isStarred: !e.isStarred } : e))
    );
  };

  return (
    <EmailContext.Provider
      value={{
        scheduledEmails,
        sentEmails,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isLoading,
        selectedEmail,
        setSelectedEmail,
        isComposing,
        setIsComposing,
        refreshEmails,
        scheduleEmail,
        toggleStar,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (!context) {
    return {
      scheduledEmails: [],
      sentEmails: [],
      activeTab: 'scheduled',
      setActiveTab: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      isLoading: false,
      selectedEmail: null,
      setSelectedEmail: () => {},
      isComposing: false,
      setIsComposing: () => {},
      refreshEmails: async () => {},
      scheduleEmail: async () => ({} as any),
      toggleStar: () => {},
    };
  }
  return context;
};
