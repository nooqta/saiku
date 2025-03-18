(function() {
    const targetUrl = 'https://chatgpt.com/backend-api/conversation';
    const originalFetch = window.fetch;
  
    function handleStream(reader, requestUrl) {
      let lastExtractedChunk = ''; // Store the last relevant extracted part of the chunk
    
      function read() {
        reader.read().then(({ done, value }) => {
          try {
            if (done) {
              // When the stream is finished, post a 'completed' message with the last extracted chunk
              window.postMessage({
                type: 'FROM_PAGE_STREAM',
                url: requestUrl,
                data: lastExtractedChunk,
                action: 'completed'
              }, '*');
              return;
            }
    
            // Decode the stream chunk
            let currentChunk = new TextDecoder("utf-8").decode(value);
            currentChunk = currentChunk.replace(/data: /g, '');
            
            if(currentChunk.includes('[DONE]') || currentChunk.includes('"is_completion": true')) {
              // If the current chunk signifies the end of the stream, don't process it
              read();
              return;
            }
    
            // Try to parse the JSON and extract the desired part
            try {
              let jsonChunk = JSON.parse(currentChunk);
              if(jsonChunk.message && jsonChunk.message.content && jsonChunk.message.content.parts) {
                // Extract the specific part of the message
                lastExtractedChunk = jsonChunk.message.content.parts[0];
              }
            } catch(parseError) {
              // ignore this chunk silently
              //console.error("Error parsing JSON:", parseError);
            }
    
            read(); // Continue reading the next chunk
          } catch (error) {
            // If an error occurs while reading the chunk, post a 'completed' message
            window.postMessage({
              type: 'FROM_PAGE_STREAM',
              url: requestUrl,
              data: lastExtractedChunk,
              action: 'completed'
            }, '*');
          }
        }).catch(error => {
          // If an error occurs while starting the stream reading, post a 'completed' message
          window.postMessage({
            type: 'FROM_PAGE_STREAM',
            url: requestUrl,
            data: lastExtractedChunk,
            action: 'completed'
          }, '*');
        });
      }
    
      read(); // Start reading the stream
    }
    
    
  
    window.fetch = function(resource, init) {
      const requestUrl = (typeof resource === 'string') ? resource : resource.url;
      if (requestUrl.startsWith(targetUrl) && (!init || init.method === 'POST')) {
        return originalFetch(resource, init)
          .then(response => {
              // Check if the response has a streamable body
              if (response.body) {
                // Immediately clone the response to create a new, untouched stream
                const clonedResponse = response.clone();
                const contentType = clonedResponse.headers.get('Content-Type');
      
                // Check if the response is the expected streamable type
                if (contentType && contentType.includes('text/event-stream')) {
                  // Handle the cloned response stream here
                  handleStream(clonedResponse.body.getReader(), requestUrl);
                }
              }
              // Always return the original response
              return response;
          }).catch(error => {
              // Check if the error name is 'AbortError', which indicates the stream was canceled
              if (error.name === 'AbortError' || error.message === 'BodyStreamBuffer was aborted') {
                // Treat this as the stream being completed
                console.log('Stream was aborted, treating as completed:', requestUrl);
                window.postMessage({
                  type: 'FROM_PAGE_STREAM',
                  url: requestUrl,
                  data: chunks,
                  action: 'completed'
                }, '*');
              } else {
                // For other errors, you can still post an error message if needed
                console.error('Stream Error:', requestUrl, error);
                window.postMessage({
                  type: 'FROM_PAGE_STREAM',
                  url: requestUrl,
                  error: error.message,
                  action: 'error'
                }, '*');
          };
      });
      } else {
        return originalFetch(resource, init);
      }
    };
  })();