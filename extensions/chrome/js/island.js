(function() {
    const targetUrl = 'https://chat.openai.com/backend-api/conversation';
    const originalFetch = window.fetch;
  
    function handleStream(reader, requestUrl) {
      let chunks = ''; // Accumulate chunks of the stream here
    
      function read() {
        reader.read().then(({ done, value }) => {
          try {
            if (done) {
              // When the stream is finished, post a 'completed' message with the accumulated chunks
              window.postMessage({
                type: 'FROM_PAGE_STREAM',
                url: requestUrl,
                data: chunks,
                action: 'completed'
              }, '*');
              return;
            }
            // Decode the stream chunk and add it to the accumulated chunks
            chunks += new TextDecoder("utf-8").decode(value);
            read(); // Continue reading the next chunk
          } catch (error) {
            // If an error occurs while reading the chunk, post a 'completed' message
            window.postMessage({
              type: 'FROM_PAGE_STREAM',
              url: requestUrl,
              data: chunks, // You may decide to send the chunks read so far or not
              action: 'completed'
            }, '*');
          }
        }).catch(error => {
          // If an error occurs while starting the stream reading, post a 'completed' message
          window.postMessage({
            type: 'FROM_PAGE_STREAM',
            url: requestUrl,
            data: chunks, // You may decide to send the chunks read so far or not
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