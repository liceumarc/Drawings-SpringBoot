package cat.esliceu.drawing.demo.models;

/**
 * One row of the gallery: a drawing plus the data the page needs
 * that does not belong to the drawing itself (author's name, ownership).
 */
public class GalleryEntry {

    private final Drawing drawing;
    private final String authorName;
    private final boolean mine;

    public GalleryEntry(Drawing drawing, String authorName, boolean mine) {
        this.drawing = drawing;
        this.authorName = authorName;
        this.mine = mine;
    }

    public Drawing getDrawing() {
        return drawing;
    }

    public String getAuthorName() {
        return authorName;
    }

    /**
     * @return true if the logged-in user owns this drawing (the page then shows the delete button)
     */
    public boolean isMine() {
        return mine;
    }
}