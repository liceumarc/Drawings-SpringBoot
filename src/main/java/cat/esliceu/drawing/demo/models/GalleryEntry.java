package cat.esliceu.drawing.demo.models;

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

    public boolean isMine() {
        return mine;
    }
}