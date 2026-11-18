package cat.esliceu.drawing.demo.models;

import java.time.LocalDateTime;

public class Drawing {

    private Long id; 
    private String name;
    private final String owner; 
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