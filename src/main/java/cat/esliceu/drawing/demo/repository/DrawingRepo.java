package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.Drawing;

import java.util.List;

/**
 * Storage of drawings. It only reads and writes data: it knows nothing about users' permissions.
 */
public interface DrawingRepo {

    /**
     * Stores the drawing. A new drawing (without id) receives a fresh id.
     */
    Drawing save(Drawing drawing);

    /**
     * @return the drawing, or null if there is none with that id
     */
    Drawing findById(long id);

    /**
     * @return the drawings of one user, newest first
     */
    List<Drawing> findByOwner(String owner);

    /**
     * @return every drawing of every user, newest first
     */
    List<Drawing> findAll();

    /**
     * @return true if a drawing was removed, false if the id did not exist
     */
    boolean deleteById(long id);
}