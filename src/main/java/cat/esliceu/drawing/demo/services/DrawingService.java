package cat.esliceu.drawing.demo.services;

import cat.esliceu.drawing.demo.models.Drawing;
import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.others.DrawingAccessDeniedException;
import cat.esliceu.drawing.demo.others.DrawingForm;
import cat.esliceu.drawing.demo.others.DrawingNotFoundException;
import cat.esliceu.drawing.demo.models.GalleryEntry;
import cat.esliceu.drawing.demo.repository.DrawingRepo;
import cat.esliceu.drawing.demo.repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DrawingService {

    private final DrawingRepo drawingRepo;
    private final UserRepo userRepo;

    public DrawingService(DrawingRepo drawingRepo, UserRepo userRepo) {
        this.drawingRepo = drawingRepo;
        this.userRepo = userRepo;
    }

    public List<Drawing> findMine(String username) {
        return drawingRepo.findByOwner(username);
    }


    public List<GalleryEntry> findGallery(String currentUsername) {
        return drawingRepo.findAll().stream()
                .map(drawing -> new GalleryEntry(
                        drawing,
                        getAuthorName(drawing.getOwner()),
                        isOwner(drawing, currentUsername)))
                .toList();
    }


    public Drawing getById(long id) {
        Drawing drawing = drawingRepo.findById(id);
        if (drawing == null) {
            throw new DrawingNotFoundException(id);
        }
        return drawing;
    }

    public boolean isOwner(Drawing drawing, String username) {
        return drawing.getOwner().equals(username);
    }

    public String getAuthorName(String username) {
        User user = userRepo.findByUserName(username);
        return user != null ? user.getName() : username;
    }

    public Drawing create(String username, DrawingForm form) {
        Drawing drawing = new Drawing(
                resolveName(form.getName()),
                username,
                form.getWidth(),
                form.getHeight(),
                form.getObjectCount(),
                form.getDrawingJson());
        drawingRepo.save(drawing);
        return drawing;
    }

    public Drawing update(long id, String username, DrawingForm form) {
        Drawing drawing = getOwnedDrawing(id, username);
        drawing.update(
                resolveName(form.getName()),
                form.getWidth(),
                form.getHeight(),
                form.getObjectCount(),
                form.getDrawingJson());
        drawingRepo.save(drawing);
        return drawing;
    }

    public void delete(long id, String username) {
        getOwnedDrawing(id, username);
        drawingRepo.deleteById(id);
    }

    private Drawing getOwnedDrawing(long id, String username) {
        Drawing drawing = getById(id);
        if (!isOwner(drawing, username)) {
            throw new DrawingAccessDeniedException(id, username);
        }
        return drawing;
    }

    private String resolveName(String name) {
        if (name == null || name.trim().isEmpty()) {
            int numero = (int) (Math.random() * 10000);
            return "dibujo-" + numero;
        }

        return name.trim();
    }
}
