const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize notes.json if it doesn't exist
const notesFile = path.join(uploadsDir, 'notes.json');
if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, JSON.stringify([]));
}

// Simple storage implementation
const storage = {
    async saveNote(note) {
        try {
            const notes = await this.getNotes();
            notes.push(note);
            await fs.promises.writeFile(notesFile, JSON.stringify(notes, null, 2));
            return note;
        } catch (error) {
            console.error('Error saving note:', error);
            throw new Error('Failed to save note');
        }
    },

    async getNotes() {
        try {
            const data = await fs.promises.readFile(notesFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading notes:', error);
            return [];
        }
    },

    async deleteNote(noteId) {
        try {
            const notes = await this.getNotes();
            const updatedNotes = notes.filter(note => note.id !== noteId);
            await fs.promises.writeFile(notesFile, JSON.stringify(updatedNotes, null, 2));
        } catch (error) {
            console.error('Error deleting note:', error);
            throw new Error('Failed to delete note');
        }
    },

    async saveFile(file) {
        try {
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(uploadsDir, fileName);
            await fs.promises.writeFile(filePath, file.buffer);
            return {
                name: file.originalname,
                url: `/uploads/${fileName}`
            };
        } catch (error) {
            console.error('Error saving file:', error);
            throw new Error('Failed to save file');
        }
    }
};

module.exports = { storage }; 