import { AMPSServer, AMPSTopic } from '../config/amps-config';

export interface AMPSConfigResponse {
  topics: AMPSTopic[];
  error?: string;
}

export class AMPSAdminService {
  /**
   * Fetches AMPS configuration from the admin interface
   * @param server AMPS server configuration
   * @returns Promise with topics and potential error
   */
  static async fetchTopics(server: AMPSServer): Promise<AMPSConfigResponse> {
    try {
      const configUrl = `http://${server.host}:${server.adminPort}/amps/instance/config.xml`;
      
      console.log(`Fetching AMPS config from: ${configUrl}`);
      
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const topics = this.parseTopicsFromConfig(xmlText);
      
      console.log(`Found ${topics.length} topics from AMPS config`);
      
      return { topics };
    } catch (error) {
      console.error('Failed to fetch AMPS config:', error);
      
      // Return fallback topics if fetch fails
      const fallbackTopics = this.getFallbackTopics();
      
      return {
        topics: fallbackTopics,
        error: error instanceof Error ? error.message : 'Failed to fetch AMPS configuration'
      };
    }
  }

  /**
   * Parses topics from AMPS config XML
   * @param xmlText Raw XML configuration
   * @returns Array of parsed topics
   */
  private static parseTopicsFromConfig(xmlText: string): AMPSTopic[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('XML parsing error: ' + parseError.textContent);
      }

      const topics: AMPSTopic[] = [];

      console.log('🔍 Parsing AMPS config XML for topics...');

      // Look for Topic elements specifically under SOW section
      const sowSection = xmlDoc.querySelector('SOW');
      if (!sowSection) {
        console.warn('⚠️ No SOW section found in AMPS config');
        return this.getFallbackTopics();
      }

      const topicElements = sowSection.querySelectorAll('Topic');
      console.log(`📋 Found ${topicElements.length} Topic elements in SOW section`);

      topicElements.forEach((topicElement, index) => {
        console.log(`🔍 Processing Topic element ${index + 1}:`);

        // Extract Name from child element
        const nameElement = topicElement.querySelector('Name');
        const messageTypeElement = topicElement.querySelector('MessageType');
        const keyElement = topicElement.querySelector('Key');
        const fileNameElement = topicElement.querySelector('FileName');

        const topicName = nameElement?.textContent?.trim();
        const messageType = messageTypeElement?.textContent?.trim() || 'json';
        const key = keyElement?.textContent?.trim() || '';
        const fileName = fileNameElement?.textContent?.trim();

        console.log(`📄 Topic details:`, {
          name: topicName,
          messageType: messageType,
          key: key,
          fileName: fileName
        });

        if (topicName) {
          topics.push({
            name: topicName,
            messageType: messageType,
            key: key,
            fileName: fileName || undefined
          });
          console.log(`✅ Added topic: ${topicName}`);
        } else {
          console.warn(`⚠️ Topic element missing Name child element`);
        }
      });

      // No need for legacy SOW parsing - we're now properly parsing the SOW section

      // Topics are properly parsed from SOW section above

      // Remove duplicates and sort
      const uniqueTopics = topics.filter((topic, index, self) =>
        index === self.findIndex(t => t.name === topic.name)
      );

      console.log(`✅ Successfully parsed ${uniqueTopics.length} topics:`, uniqueTopics.map(t => t.name));
      return uniqueTopics.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error('Error parsing AMPS config XML:', error);
      return this.getFallbackTopics();
    }
  }

  /**
   * Returns fallback topics when config fetch fails
   * @returns Array of fallback topics
   */
  private static getFallbackTopics(): AMPSTopic[] {
    return [
      {
        name: "Orders",
        messageType: "json",
        key: "/id"
      },
      {
        name: "market_data",
        messageType: "json", 
        key: "/symbol"
      },
      {
        name: "Trades",
        messageType: "json",
        key: "/trade_id"
      },
      {
        name: "Quotes",
        messageType: "json",
        key: "/symbol"
      },
      {
        name: "Positions",
        messageType: "json",
        key: "/account_id,/symbol"
      }
    ];
  }

  /**
   * Validates if a topic name is valid
   * @param topicName Topic name to validate
   * @returns boolean indicating if topic is valid
   */
  static isValidTopicName(topicName: string): boolean {
    // Basic validation - topic names should not be empty and follow AMPS naming conventions
    return topicName.length > 0 && 
           /^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(topicName) &&
           topicName.length <= 255;
  }

  /**
   * Gets the admin URL for a server
   * @param server AMPS server configuration
   * @returns Admin URL string
   */
  static getAdminUrl(server: AMPSServer): string {
    return `http://${server.host}:${server.adminPort}`;
  }

  /**
   * Gets the config XML URL for a server
   * @param server AMPS server configuration
   * @returns Config XML URL string
   */
  static getConfigUrl(server: AMPSServer): string {
    return `${this.getAdminUrl(server)}/amps/instance/config.xml`;
  }
}
