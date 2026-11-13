package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.Drawing;
import cat.esliceu.drawing.demo.models.DrawingElement;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory implementation of {@link DrawingRepo}.
 * Data is lost when the server restarts, as the assignment allows.
 */

@Repository
public class DrawingRepoImpl implements DrawingRepo {

    private static final Comparator<Drawing> NEWEST_FIRST = Comparator.comparing(Drawing::getId).reversed();
    private final ObjectMapper objectMapper;
    private final ConcurrentMap<Long, Drawing> drawings = new ConcurrentHashMap<>();
    private long nextId = 1;

    public DrawingRepoImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Drawing save(Drawing drawing) {
        if (drawing.getId() == null) {
            drawing.setId(nextId++);
        }
        System.out.println(drawing);
        drawings.put(drawing.getId(), drawing);
        return drawing;
    }

    @Override
    public Drawing findById(long id) {
        return drawings.get(id);
    }

    @Override
    public List<Drawing> findByOwner(String owner) {
        return drawings.values().stream()
                .filter(drawing -> drawing.getOwner().equals(owner))
                .sorted(NEWEST_FIRST)
                .toList();
    }

    @Override
    public List<Drawing> findAll() {
        return drawings.values().stream()
                .sorted(NEWEST_FIRST)
                .toList();
    }

    @Override
    public boolean deleteById(long id) {
        return drawings.remove(id) != null;
    }

    @Override
    public List<DrawingElement> mapJsonToElements(String json) {
        return objectMapper.readValue(
                json,
                new TypeReference<List<DrawingElement>>() {}
        );
    }

}