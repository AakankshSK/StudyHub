// Notes Script
const notesContainer = document.getElementById("notesContainer");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const fileInput = document.getElementById("fileInput");
const addNoteButton = document.getElementById("addNoteButton");

// Load existing notes
document.addEventListener("DOMContentLoaded", () => {
    try {
        const notes = getNotesFromStorage();
        if (notes.length === 0) {
            showInfo('No notes found. Create your first note!');
        } else {
            notes.forEach(note => addNoteToDOM(note));
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Failed to load notes. Please try again later.');
    }
});

// Add new note
addNoteButton.addEventListener("click", () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const files = fileInput.files;

    if (!title || !content) {
        showError('Please fill in both title and content');
        return;
    }

    try {
        const noteId = Date.now().toString();
        const attachments = Array.from(files).map(file => {
            // Convert file to base64 string for storage
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        name: file.name,
                        type: file.type,
                        data: reader.result // base64 string
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(attachments).then(resolvedAttachments => {
            const note = {
                id: noteId,
                title,
                content,
                attachments: resolvedAttachments,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            saveNoteToStorage(note);
            
            // Add to DOM
            addNoteToDOM(note);
            
            // Clear form
            noteTitle.value = "";
            noteContent.value = "";
            fileInput.value = "";
            
            showSuccess('Note created successfully!');
        }).catch(error => {
            console.error('Error processing files:', error);
            showError('Failed to process attachments. Please try again.');
        });
    } catch (error) {
        console.error('Error creating note:', error);
        showError('Failed to create note. Please try again.');
    }
});

// Add note to DOM
function addNoteToDOM(note) {
    const noteElement = document.createElement("div");
    noteElement.className = "note-card";
    noteElement.id = `note-${note.id}`;
    
    const formattedDate = new Date(note.createdAt).toLocaleString();
    
    noteElement.innerHTML = `
        <div class="note-header">
            <h2>${note.title}</h2>
            <div class="note-actions">
                <button class="delete-button" onclick="deleteNote('${note.id}')">
                    Delete
                </button>
            </div>
        </div>
        <div class="note-content">
            <p>${note.content}</p>
            <div class="note-meta">
                <span class="note-date">Created: ${formattedDate}</span>
                ${note.attachments && note.attachments.length > 0
                    ? `<span class="attachment-count">${note.attachments.length} attachment(s)</span>`
                    : ''
                }
            </div>
        </div>
        <div class="attachments">
            ${note.attachments && note.attachments.length > 0
                ? note.attachments.map(attachment => `
                    <a href="#" onclick="handleAttachmentClick(event, '${note.id}', '${attachment.name}')">
                         ${attachment.name}
                    </a>
                `).join('')
                : ''
            }
        </div>
    `;
    notesContainer.appendChild(noteElement);
}

// Handle attachment click
function handleAttachmentClick(event, noteId, fileName) {
    event.preventDefault();
    const notes = getNotesFromStorage();
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const attachment = note.attachments.find(a => a.name === fileName);
    if (!attachment) return;

    // Create a download link for the base64 data
    const a = document.createElement('a');
    a.href = attachment.data;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Delete note
function deleteNote(noteId) {
    const noteElement = document.getElementById(`note-${noteId}`);
    if (!noteElement) {
        showError('Note not found');
        return;
    }

    if (confirm('Are you sure you want to delete this note?')) {
        try {
            // Remove from localStorage
            const notes = getNotesFromStorage();
            const updatedNotes = notes.filter(note => note.id !== noteId);
            localStorage.setItem('notes', JSON.stringify(updatedNotes));

            // Remove from DOM
            noteElement.remove();
            showSuccess('Note deleted successfully!');
            
            // Check if no notes are left
            if (notesContainer.children.length === 0) {
                showInfo('No notes found. Create a new note!');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            showError('Failed to delete note. Please try again.');
        }
    }
}

// Storage functions
function getNotesFromStorage() {
    try {
        const notes = localStorage.getItem('notes');
        return notes ? JSON.parse(notes) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

function saveNoteToStorage(note) {
    try {
        const notes = getNotesFromStorage();
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        throw new Error('Failed to save note');
    }
}

// Message functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function showInfo(message) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.textContent = message;
    document.body.appendChild(infoDiv);
    setTimeout(() => infoDiv.remove(), 3000);
}
