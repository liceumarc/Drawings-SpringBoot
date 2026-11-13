package cat.esliceu.drawing.demo.models;

import java.time.LocalDateTime;

/**
 * A drawing sent to the server by a user.
 * The content (the list of shapes) is kept as the JSON text produced by the browser editor.
 * The server does not interpret it: it only stores it and shows the number of objects.
 */
public class Drawing {

    private Long id; // null until the repository saves the drawing for the first time
    private String name;
    private final String owner; // login of the user who created the drawing
    private int width;
    private int height;
    private int objectCount;
    private String json;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Drawing(String name, String owner, int width, int height, int objectCount, String json) {
        this.name = name;
        this.owner = owner;
        this.width = width;
        this.height = height;
        this.objectCount = objectCount;
        this.json = json;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /**
     * Replaces the content of the drawing and refreshes the modification date.
     */
    public void update(String name, int width, int height, int objectCount, String json) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.objectCount = objectCount;
        this.json = json;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public String getOwner() {
        return owner;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getObjectCount() {
        return objectCount;
    }

    public String getJson() {
        return json;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public String toString() {
        return "Drawing{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", owner='" + owner + '\'' +
                ", width=" + width +
                ", height=" + height +
                ", objectCount=" + objectCount +
                ", json='" + json + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}