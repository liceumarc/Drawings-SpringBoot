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
import tools.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * Business rules for drawings: anybody can view a drawing,
 * only its owner can modify or delete it.
 * The form received here must already be validated by the controller.
 */
@Service
public class DrawingService {

    private final DrawingRepo drawingRepo;
    private final UserRepo userRepo;

    public DrawingService(DrawingRepo drawingRepo, UserRepo userRepo) {
        this.drawingRepo = drawingRepo;
        this.userRepo = userRepo;
    }

    /**
     * @return the drawings created by that user, newest first
     */
    public List<Drawing> findMine(String username) {
        return drawingRepo.findByOwner(username);
    }

    /**
     * @param currentUsername the logged-in user, used to flag which rows are his
     * @return every drawing of every user, newest first
     */

    public List<GalleryEntry> findGallery(String currentUsername) {
        return drawingRepo.findAll().stream()
                .map(drawing -> new GalleryEntry(
                        drawing,
                        getAuthorName(drawing.getOwner()),
                        isOwner(drawing, currentUsername)))
                .toList();
    }


    /**
     * Any user can read any drawing.
     *
     * @throws DrawingNotFoundException if the id does not exist
     */
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

    /**
     * @return the display name of the user, or the login if the user is not found
     */
    public String getAuthorName(String username) {
        User user = userRepo.findByUserName(username);
        return user != null ? user.getName() : username;
    }

    /**
     * Creates a new drawing owned by the given user. It is also used for "send as copy".
     */
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

    /**
     * Replaces the content of an existing drawing.
     *
     * @throws DrawingNotFoundException      if the id does not exist
     * @throws DrawingAccessDeniedException  if the user is not the owner
     */
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

    /**
     * Deletes a drawing.
     *
     * @throws DrawingNotFoundException      if the id does not exist
     * @throws DrawingAccessDeniedException  if the user is not the owner
     */
    public void delete(long id, String username) {
        getOwnedDrawing(id, username);
        drawingRepo.deleteById(id);
    }

    /**
     * Finds a drawing and checks that the user owns it.
     * This is the server-side check that hiding a button in the page cannot replace.
     */
    private Drawing getOwnedDrawing(long id, String username) {
        Drawing drawing = getById(id);
        if (!isOwner(drawing, username)) {
            throw new DrawingAccessDeniedException(id, username);
        }
        return drawing;
    }

    /**
     * Trims the name given by the user, or invents one such as "dibujo-a3f9" if it is empty.
     */
    private String resolveName(String name) {
        if (name == null || name.trim().isEmpty()) {
            int numero = (int) (Math.random() * 10000);
            return "dibujo-" + numero;
        }

        return name.trim();
    }
}
