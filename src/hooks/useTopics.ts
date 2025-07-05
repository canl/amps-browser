import { useState, useEffect } from 'react';
import { AMPSTopic } from '../config/amps-config';
import { AMPSConnectionState } from '../types/amps-types';
import { AMPSAdminService } from '../services/amps-admin-service';

export const useTopics = (connectionState: AMPSConnectionState) => {
  const [availableTopics, setAvailableTopics] = useState<AMPSTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch topics dynamically when connected to a server
  useEffect(() => {
    const fetchTopics = async () => {
      if (connectionState.isConnected && connectionState.server) {
        setIsLoading(true);
        setFetchError(null);
        
        try {
          // Find the server configuration
          const { AMPS_SERVERS } = await import('../config/amps-config');
          const server = AMPS_SERVERS.find(s => s.name === connectionState.server);
          
          if (server) {
            const result = await AMPSAdminService.fetchTopics(server);
            setAvailableTopics(result.topics);
            
            if (result.error) {
              setFetchError(`Warning: ${result.error}. Using fallback topics.`);
            }
          } else {
            throw new Error(`Server configuration not found: ${connectionState.server}`);
          }
        } catch (error) {
          console.error('Failed to fetch topics:', error);
          setFetchError(error instanceof Error ? error.message : 'Failed to fetch topics');
          // Set fallback topics
          setAvailableTopics([
            { name: "Orders", messageType: "json", key: "/id" },
            { name: "market_data", messageType: "json", key: "/symbol" },
            { name: "Trades", messageType: "json", key: "/trade_id" },
            { name: "Account_Balances", messageType: "json", key: "/account_id" },
            { name: "Positions", messageType: "json", key: "/account_id,/symbol" }
          ]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear topics when not connected
        setAvailableTopics([]);
        setFetchError(null);
      }
    };

    fetchTopics();
  }, [connectionState.isConnected, connectionState.server]);

  return {
    availableTopics,
    isLoading,
    fetchError,
    topicNames: availableTopics.map(topic => topic.name)
  };
};
