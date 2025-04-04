const express = require('express');
const router = express.Router();
const { storage } = require('../config/storage');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get all notes
router.get('/notes', async (req, res) => {
    try {
        const notes = await storage.getNotes();
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create a new note
router.post('/notes', upload.array('attachments'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const noteId = Date.now().toString();

        // Upload attachments if any
        const attachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const attachment = await storage.saveFile(file);
                attachments.push(attachment);
            }
        }

        // Save the note
        const note = {
            id: noteId,
            title,
            content,
            attachments,
            createdAt: new Date().toISOString()
        };

        await storage.saveNote(note);
        res.json({ success: true, id: noteId });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Delete a note
router.delete('/notes/:id', async (req, res) => {
    try {
        const noteId = req.params.id;
        await storage.deleteNote(noteId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

module.exports = router; 