// Save settings
document.getElementById('save').addEventListener('click', function() {
    const appKey = document.getElementById('pusherAppKey').value;
    const cluster = document.getElementById('pusherCluster').value;
    
    chrome.storage.sync.set({
        pusherAppKey: appKey,
        pusherCluster: cluster
    }, function() {
        alert('Settings saved!');
    });
});

// Load settings
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['pusherAppKey', 'pusherCluster'], function(items) {
        document.getElementById('pusherAppKey').value = items.pusherAppKey || '';
        document.getElementById('pusherCluster').value = items.pusherCluster || '';
    });
});
