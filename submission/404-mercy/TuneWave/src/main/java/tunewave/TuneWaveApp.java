package tunewave;

import java.io.File;
import java.util.List;
import javafx.animation.AnimationTimer;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Slider;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.shape.SVGPath;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

/**
 * Production-grade JavaFX Desktop Music Player for TuneWave (Team 404 MERCY).
 *
 * <p>Inspired by the user experience and visual architecture of Spotify and Apple Music,
 * styled with a dedicated CSS stylesheet, crisp vector SVG iconography, real local
 * audio playback with sample-accurate timeline seeking, and deep integration with
 * the underlying Computer Science Data Structures & Algorithms facade.</p>
 */
public class TuneWaveApp extends Application {

    private TuneWaveService service;
    private AudioEngine audioEngine;
    private Stage primaryStage;

    // ── Layout Navigation ────────────────────────────────────────────────────
    private StackPane stageStack;
    private VBox homeView;
    private VBox discoverView;
    private VBox libraryView;
    private VBox rightDrawer;
    private boolean drawerVisible = true;

    private Button navHomeBtn;
    private Button navDiscoverBtn;
    private Button navLibraryBtn;

    // ── Hero Card Controls ───────────────────────────────────────────────────
    private FxAlbumArtwork heroArtwork;
    private Label heroTitle;
    private Label heroArtist;
    private Label heroIdBadge;
    private Label heroAudioBadge;
    private Button heroPlayBtn;
    private Slider heroSeekBar;
    private Label heroTimeCurrent;
    private Label heroTimeTotal;
    private GridPane quickPlayGrid;

    // ── Discover & Search Controls ───────────────────────────────────────────
    private TextField searchField;
    private TableView<Song> searchTable;
    private final ObservableList<Song> searchList = FXCollections.observableArrayList();
    private TextField artistField;
    private FlowPane artistChipsPane;

    // ── Library / Playlist Controls ──────────────────────────────────────────
    private TableView<Song> playlistTable;
    private final ObservableList<Song> playlistList = FXCollections.observableArrayList();
    private Label libraryCountLabel;

    // ── Queue & History Controls ─────────────────────────────────────────────
    private final ObservableList<String> upNextItems = FXCollections.observableArrayList();
    private final ObservableList<String> historyItems = FXCollections.observableArrayList();
    private ListView<String> upNextListView;
    private ListView<String> historyListView;
    private TextField quickEnqueueField;
    private Label queueBadge;
    private Label historyBadge;

    // ── Persistent Bottom Player Controls ────────────────────────────────────
    private FxAlbumArtwork bottomThumb;
    private Label bottomTitle;
    private Label bottomArtist;
    private Label bottomAudioTag;
    private Button bottomPlayBtn;
    private Button bottomRepeatBtn;
    private SVGPath bottomPlayIcon;
    private Slider bottomSeekBar;
    private Label bottomTimeCurrent;
    private Label bottomTimeTotal;
    private Slider volumeSlider;
    private Label bottomStatusPill;

    // ── Seeking & State Synchronization ──────────────────────────────────────
    private boolean isUserSeeking = false;
    private AnimationTimer renderLoop;

    public TuneWaveApp() {
        // Default constructor
    }

    @Override
    public void init() {
        // Retrieve or build shared service
        this.service = Main.buildSampleData();
        this.audioEngine = new AudioEngine();

        // Populate built-in preview audio files for demo tracks
        File cacheDir = new File("audio_cache");
        audioEngine.initSampleAudioCache(cacheDir, service.getAllSongs());

        // Wire natural track-end progression to service.playNext()
        audioEngine.setOnTrackFinished(() -> Platform.runLater(this::handlePlayNext));
    }

    @Override
    public void start(Stage stage) {
        this.primaryStage = stage;
        stage.setTitle("TuneWave — Desktop Music Player");

        BorderPane root = new BorderPane();
        root.getStyleClass().add("root");

        // 1. Left Sidebar
        root.setLeft(createSidebar());

        // 2. Central Content Stage
        stageStack = new StackPane();
        homeView = createHomeView();
        discoverView = createDiscoverView();
        libraryView = createLibraryView();

        stageStack.getChildren().addAll(discoverView, libraryView, homeView);
        showStageView("HOME");

        // 3. Right Queue Drawer
        rightDrawer = createRightDrawer();

        BorderPane centerArea = new BorderPane();
        centerArea.setCenter(stageStack);
        centerArea.setRight(rightDrawer);
        root.setCenter(centerArea);

        // 4. Persistent Bottom Player Bar
        root.setBottom(createBottomPlayer());

        Scene scene = new Scene(root, 1280, 800);
        // Load separate CSS stylesheet
        String cssUrl = getClass().getResource("/tunewave/styles.css") != null
                ? getClass().getResource("/tunewave/styles.css").toExternalForm()
                : null;
        if (cssUrl != null) {
            scene.getStylesheets().add(cssUrl);
        }

        stage.setScene(scene);
        stage.setMinWidth(1060);
        stage.setMinHeight(680);
        stage.show();

        setupRenderLoop();
        refreshAllViews("Ready. Press Play or choose a song to start.");
    }

    @Override
    public void stop() {
        if (renderLoop != null) {
            renderLoop.stop();
        }
        if (audioEngine != null) {
            audioEngine.close();
        }
    }

    // =========================================================================
    // 1. Left Sidebar Navigation
    // =========================================================================

    private Node createSidebar() {
        VBox sidebar = new VBox(6);
        sidebar.setPrefWidth(220);
        sidebar.setMinWidth(200);
        sidebar.setMaxWidth(240);
        sidebar.getStyleClass().add("sidebar");

        // Brand Header with vector logo mark
        HBox brandRow = new HBox(8);
        brandRow.setAlignment(Pos.CENTER_LEFT);
        brandRow.setPadding(new Insets(4, 8, 2, 8));

        Circle mark1 = new Circle(4, Color.web("#1ed760"));
        Circle mark2 = new Circle(3.5, Color.web("#38bdf8"));
        Circle mark3 = new Circle(3, Color.web("#a855f7"));
        HBox marks = new HBox(3, mark1, mark2, mark3);
        marks.setAlignment(Pos.CENTER);

        Label brandLabel = new Label("TuneWave");
        brandLabel.getStyleClass().add("brand-title");
        brandRow.getChildren().addAll(marks, brandLabel);

        Label subLabel = new Label("TEAM 404 MERCY");
        subLabel.getStyleClass().add("brand-badge");
        subLabel.setPadding(new Insets(0, 0, 16, 26));

        sidebar.getChildren().addAll(brandRow, subLabel);

        // Navigation Buttons
        navHomeBtn = createNavButton("Home", Icons.HOME, true, () -> showStageView("HOME"));
        navDiscoverBtn = createNavButton("Discover & Search", Icons.SEARCH, false, () -> showStageView("DISCOVER"));
        navLibraryBtn = createNavButton("Your Library", Icons.LIBRARY, false, () -> showStageView("LIBRARY"));

        sidebar.getChildren().addAll(navHomeBtn, navDiscoverBtn, navLibraryBtn);

        // Quick Collections & Actions
        Label collHeading = new Label("PLAYLIST & ACTIONS");
        collHeading.getStyleClass().add("sidebar-heading");
        sidebar.getChildren().add(collHeading);

        Button linkAudioBtn = createSidebarLink("Link Audio File...", Icons.LINK_AUDIO, () -> {
            Song curr = service.currentlyPlaying();
            if (curr == null) curr = service.currentSong();
            chooseAndLinkAudio(curr != null ? curr.getSongId() : null);
        });

        Button repeatToggleBtn = createSidebarLink("Toggle Repeat Mode", Icons.REPEAT, this::handleToggleRepeat);
        Button toggleQueueBtn = createSidebarLink("Toggle Queue Drawer", Icons.QUEUE, this::toggleRightDrawer);

        sidebar.getChildren().addAll(linkAudioBtn, repeatToggleBtn, toggleQueueBtn);

        // Spacer to push DSA note to bottom
        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);
        sidebar.getChildren().add(spacer);

        // DSA Architecture footer
        VBox footer = new VBox(2);
        footer.setPadding(new Insets(8, 12, 8, 12));
        Label dsaTitle = new Label("DSA Architecture");
        dsaTitle.getStyleClass().add("caption");
        Label dsaDesc = new Label("DLL • BST • Graph • Stack");
        dsaDesc.setStyle("-fx-text-fill: #444444; -fx-font-size: 10px;");
        footer.getChildren().addAll(dsaTitle, dsaDesc);
        sidebar.getChildren().add(footer);

        return sidebar;
    }

    private Button createNavButton(String text, String svgPath, boolean active, Runnable action) {
        Button btn = new Button(text);
        SVGPath icon = Icons.createIcon(svgPath, 0.85, active ? Color.WHITE : Color.web("#b3b3b3"));
        btn.setGraphic(icon);
        btn.setGraphicTextGap(12);
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.getStyleClass().add("nav-button");
        if (active) {
            btn.getStyleClass().add("active");
        }
        btn.setOnAction(e -> action.run());
        return btn;
    }

    private Button createSidebarLink(String text, String svgPath, Runnable action) {
        Button btn = new Button(text);
        SVGPath icon = Icons.createIcon(svgPath, 0.75, Color.web("#b3b3b3"));
        btn.setGraphic(icon);
        btn.setGraphicTextGap(10);
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.getStyleClass().add("sidebar-link");
        btn.setOnAction(e -> action.run());
        return btn;
    }

    private void showStageView(String view) {
        navHomeBtn.getStyleClass().remove("active");
        navDiscoverBtn.getStyleClass().remove("active");
        navLibraryBtn.getStyleClass().remove("active");

        if ("HOME".equals(view)) {
            homeView.toFront();
            navHomeBtn.getStyleClass().add("active");
        } else if ("DISCOVER".equals(view)) {
            discoverView.toFront();
            navDiscoverBtn.getStyleClass().add("active");
        } else if ("LIBRARY".equals(view)) {
            libraryView.toFront();
            navLibraryBtn.getStyleClass().add("active");
        }
    }

    private void toggleRightDrawer() {
        drawerVisible = !drawerVisible;
        rightDrawer.setVisible(drawerVisible);
        rightDrawer.setManaged(drawerVisible);
    }

    // =========================================================================
    // 2. Central Content Stage — View 1: Home
    // =========================================================================

    private VBox createHomeView() {
        VBox view = new VBox(24);
        view.getStyleClass().add("stage-container");

        // 1. Featured Now Playing Hero Card
        HBox heroCard = new HBox(24);
        heroCard.getStyleClass().add("hero-card");
        heroCard.setAlignment(Pos.CENTER_LEFT);

        heroArtwork = new FxAlbumArtwork(160, 10);
        heroCard.getChildren().add(heroArtwork);

        VBox heroMeta = new VBox(10);
        heroMeta.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(heroMeta, Priority.ALWAYS);

        // Status Pills
        HBox pillsRow = new HBox(8);
        heroIdBadge = new Label("ID: S01");
        heroIdBadge.getStyleClass().add("status-pill-muted");

        heroAudioBadge = new Label("AUDIO LINKED");
        heroAudioBadge.getStyleClass().add("status-pill");
        pillsRow.getChildren().addAll(heroIdBadge, heroAudioBadge);

        heroTitle = new Label("Select a Song to Begin");
        heroTitle.getStyleClass().add("title-large");

        heroArtist = new Label("TuneWave Player");
        heroArtist.getStyleClass().add("subtitle");

        // Timeline Slider Row
        HBox timeRow = new HBox(12);
        timeRow.setAlignment(Pos.CENTER);

        heroTimeCurrent = new Label("0:00");
        heroTimeCurrent.getStyleClass().add("time-label");

        heroSeekBar = new Slider(0, 100, 0);
        HBox.setHgrow(heroSeekBar, Priority.ALWAYS);
        setupSeekSlider(heroSeekBar);

        heroTimeTotal = new Label("0:00");
        heroTimeTotal.getStyleClass().add("time-label");

        timeRow.getChildren().addAll(heroTimeCurrent, heroSeekBar, heroTimeTotal);

        // Transport Controls
        HBox controls = new HBox(12);
        controls.setAlignment(Pos.CENTER_LEFT);

        Button prevBtn = createIconButton(Icons.PREVIOUS, "Previous cursor song", this::handlePlaylistPrev);
        heroPlayBtn = new Button("Play");
        heroPlayBtn.setGraphic(Icons.createIcon(Icons.PLAY, 0.85, Color.BLACK));
        heroPlayBtn.getStyleClass().add("primary-button");
        heroPlayBtn.setOnAction(e -> handleTogglePlayPause());

        Button nextBtn = createIconButton(Icons.NEXT, "Play next (queue priority)", this::handlePlayNext);
        Button linkBtn = new Button("Link Audio...");
        linkBtn.setGraphic(Icons.createIcon(Icons.LINK_AUDIO, 0.75, Color.WHITE));
        linkBtn.getStyleClass().add("secondary-button");
        linkBtn.setOnAction(e -> {
            Song s = service.currentlyPlaying();
            if (s == null) s = service.currentSong();
            chooseAndLinkAudio(s != null ? s.getSongId() : null);
        });

        controls.getChildren().addAll(prevBtn, heroPlayBtn, nextBtn, linkBtn);

        heroMeta.getChildren().addAll(pillsRow, heroTitle, heroArtist, timeRow, controls);
        heroCard.getChildren().add(heroMeta);
        view.getChildren().add(heroCard);

        // 2. Quick Play Catalog Grid
        Label gridTitle = new Label("Quick Play Catalog");
        gridTitle.getStyleClass().add("title-medium");
        view.getChildren().add(gridTitle);

        quickPlayGrid = new GridPane();
        quickPlayGrid.setHgap(14);
        quickPlayGrid.setVgap(14);
        populateQuickPlayGrid();
        view.getChildren().add(quickPlayGrid);

        ScrollPane scroll = new ScrollPane(view);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color: transparent; -fx-background: transparent;");

        VBox wrapper = new VBox(scroll);
        VBox.setVgrow(scroll, Priority.ALWAYS);
        return wrapper;
    }

    private void populateQuickPlayGrid() {
        quickPlayGrid.getChildren().clear();
        List<Song> songs = service.getPlaylistSongs();
        int count = 0;
        for (Song s : songs) {
            if (count >= 6) break;
            Node card = createQuickPlayCard(s);
            quickPlayGrid.add(card, count % 3, count / 3);
            count++;
        }
    }

    private Node createQuickPlayCard(Song song) {
        HBox card = new HBox(12);
        card.getStyleClass().add("quick-card");
        card.setAlignment(Pos.CENTER_LEFT);
        card.setPrefWidth(280);

        FxAlbumArtwork art = new FxAlbumArtwork(52, 6);
        art.update(song, false);

        VBox meta = new VBox(2);
        meta.setAlignment(Pos.CENTER_LEFT);
        HBox.setHgrow(meta, Priority.ALWAYS);

        Label title = new Label(song.getTitle());
        title.getStyleClass().add("title-small");
        Label artist = new Label(song.getArtist() + " • " + song.getSongId());
        artist.getStyleClass().add("caption");

        meta.getChildren().addAll(title, artist);

        Button playIco = new Button();
        playIco.setGraphic(Icons.createIcon(Icons.PLAY, 0.75, Color.BLACK));
        playIco.getStyleClass().add("play-circle-button");
        playIco.setOnAction(e -> playSongDirectly(song));

        card.getChildren().addAll(art, meta, playIco);
        card.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) playSongDirectly(song);
        });

        return card;
    }

    // =========================================================================
    // 2. Central Content Stage — View 2: Discover & Search
    // =========================================================================

    private VBox createDiscoverView() {
        VBox view = new VBox(18);
        view.getStyleClass().add("stage-container");

        Label header = new Label("Discover & Search");
        header.getStyleClass().add("title-large");
        Label sub = new Label("Binary Search Tree lookup (exact & prefix pruning) and Artist Graph similarity network");
        sub.getStyleClass().add("caption");

        // Search Input Bar
        HBox searchRow = new HBox(12);
        searchRow.setAlignment(Pos.CENTER_LEFT);

        searchField = new TextField();
        searchField.setPromptText("Search songs by title or prefix (e.g. 'Bl', 'Shape', 'Bohemian')...");
        searchField.getStyleClass().add("search-input");
        HBox.setHgrow(searchField, Priority.ALWAYS);

        searchField.textProperty().addListener((obs, oldV, newV) -> runLiveSearch(newV));

        Button exactBtn = new Button("Find Exact Title");
        exactBtn.setGraphic(Icons.createIcon(Icons.SEARCH, 0.75, Color.WHITE));
        exactBtn.getStyleClass().add("secondary-button");
        exactBtn.setOnAction(e -> runExactSearch());

        searchRow.getChildren().addAll(searchField, exactBtn);

        // Search Results Table
        searchTable = new TableView<>(searchList);
        setupSearchTable();
        VBox.setVgrow(searchTable, Priority.ALWAYS);

        // Artist Graph Explorer Box
        VBox artistSection = new VBox(10);
        artistSection.getStyleClass().add("hero-card");
        artistSection.setStyle("-fx-padding: 16;");

        Label graphTitle = new Label("Artist Similarity Network (Distance-2 Graph)");
        graphTitle.getStyleClass().add("title-small");

        HBox artistInputRow = new HBox(10);
        artistInputRow.setAlignment(Pos.CENTER_LEFT);

        artistField = new TextField();
        artistField.setPromptText("Type artist name (e.g. The Weeknd, Drake, Adele)...");
        artistField.getStyleClass().add("text-input-field");
        HBox.setHgrow(artistField, Priority.ALWAYS);
        artistField.setOnAction(e -> exploreArtistRelations());

        Button exploreBtn = new Button("Find Similar Artists");
        exploreBtn.getStyleClass().add("primary-button");
        exploreBtn.setOnAction(e -> exploreArtistRelations());

        artistInputRow.getChildren().addAll(artistField, exploreBtn);

        artistChipsPane = new FlowPane(8, 8);
        artistChipsPane.setPadding(new Insets(6, 0, 0, 0));

        artistSection.getChildren().addAll(graphTitle, artistInputRow, artistChipsPane);

        view.getChildren().addAll(header, sub, searchRow, searchTable, artistSection);
        runLiveSearch("");
        return view;
    }

    private void setupSearchTable() {
        searchTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        searchTable.setRowFactory(tv -> {
            TableRow<Song> row = new TableRow<>();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && (!row.isEmpty())) {
                    playSongDirectly(row.getItem());
                }
            });
            return row;
        });

        TableColumn<Song, String> idCol = new TableColumn<>("ID");
        idCol.setPrefWidth(60);
        idCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getSongId()));

        TableColumn<Song, String> titleCol = new TableColumn<>("Title");
        titleCol.setPrefWidth(220);
        titleCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getTitle()));

        TableColumn<Song, String> artistCol = new TableColumn<>("Artist");
        artistCol.setPrefWidth(180);
        artistCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getArtist()));

        TableColumn<Song, String> audioCol = new TableColumn<>("Audio File");
        audioCol.setPrefWidth(200);
        audioCol.setCellValueFactory(data -> new SimpleStringProperty(audioEngine.getAudioFileName(data.getValue().getSongId())));

        searchTable.getColumns().addAll(idCol, titleCol, artistCol, audioCol);
    }

    private void runLiveSearch(String query) {
        searchList.clear();
        String q = query != null ? query.trim() : "";
        if (q.isEmpty()) {
            searchList.addAll(service.getPlaylistSongs());
        } else {
            List<Song> matches = service.prefixSearch(q);
            Song exact = service.searchByTitle(q);
            if (exact != null && !matches.contains(exact)) {
                searchList.add(exact);
            }
            searchList.addAll(matches);
        }
    }

    private void runExactSearch() {
        String q = searchField.getText().trim();
        if (q.isEmpty()) return;
        Song match = service.searchByTitle(q);
        searchList.clear();
        if (match != null) {
            searchList.add(match);
        } else {
            Alert alert = new Alert(Alert.AlertType.INFORMATION, "No song found with exact title: \"" + q + "\"", ButtonType.OK);
            alert.setHeaderText("BST Title Search");
            alert.showAndWait();
        }
    }

    private void exploreArtistRelations() {
        String artist = artistField.getText().trim();
        artistChipsPane.getChildren().clear();
        if (artist.isEmpty()) return;

        List<String> recs = service.recommendArtists(artist);
        if (recs.isEmpty()) {
            Label none = new Label("No distance-2 recommendations in artist graph for \"" + artist + "\"");
            none.getStyleClass().add("caption");
            artistChipsPane.getChildren().add(none);
        } else {
            for (String rec : recs) {
                Button chip = new Button("✨ " + rec);
                chip.getStyleClass().add("secondary-button");
                chip.setOnAction(e -> {
                    searchField.setText(rec);
                    runLiveSearch(rec);
                });
                artistChipsPane.getChildren().add(chip);
            }
        }
    }

    // =========================================================================
    // 2. Central Content Stage — View 3: Library / Playlist
    // =========================================================================

    private VBox createLibraryView() {
        VBox view = new VBox(18);
        view.getStyleClass().add("stage-container");

        // Top Header & Actions
        HBox topRow = new HBox(16);
        topRow.setAlignment(Pos.CENTER_LEFT);

        VBox titleBox = new VBox(2);
        Label title = new Label("Your Library — Playlist");
        title.getStyleClass().add("title-large");
        libraryCountLabel = new Label("12 tracks • Custom Doubly-Linked List with O(1) Cursor Movement");
        libraryCountLabel.getStyleClass().add("caption");
        titleBox.getChildren().addAll(title, libraryCountLabel);
        HBox.setHgrow(titleBox, Priority.ALWAYS);

        // Action Toolbar
        HBox toolbar = new HBox(8);
        toolbar.setAlignment(Pos.CENTER_RIGHT);

        Button playBtn = new Button("Play Track");
        playBtn.setGraphic(Icons.createIcon(Icons.PLAY, 0.75, Color.BLACK));
        playBtn.getStyleClass().add("primary-button");
        playBtn.setOnAction(e -> handlePlaySelectedFromLibrary());

        Button queueBtn = new Button("+ Add to Up Next");
        queueBtn.getStyleClass().add("secondary-button");
        queueBtn.setOnAction(e -> handleQueueSelectedFromLibrary());

        Button linkBtn = new Button("Link Audio...");
        linkBtn.setGraphic(Icons.createIcon(Icons.LINK_AUDIO, 0.75, Color.WHITE));
        linkBtn.getStyleClass().add("secondary-button");
        linkBtn.setOnAction(e -> handleLinkAudioSelectedFromLibrary());

        Button removeBtn = new Button("Remove");
        removeBtn.setGraphic(Icons.createIcon(Icons.TRASH, 0.75, Color.WHITE));
        removeBtn.getStyleClass().add("secondary-button");
        removeBtn.setOnAction(e -> handleRemoveSelectedFromLibrary());

        toolbar.getChildren().addAll(playBtn, queueBtn, linkBtn, removeBtn);
        topRow.getChildren().addAll(titleBox, toolbar);

        // Playlist Table
        playlistTable = new TableView<>(playlistList);
        setupPlaylistTable();
        VBox.setVgrow(playlistTable, Priority.ALWAYS);

        view.getChildren().addAll(topRow, playlistTable);
        return view;
    }

    private void setupPlaylistTable() {
        playlistTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        playlistTable.setRowFactory(tv -> {
            TableRow<Song> row = new TableRow<>() {
                @Override
                protected void updateItem(Song item, boolean empty) {
                    super.updateItem(item, empty);
                    if (empty || item == null) {
                        setStyle("");
                    } else {
                        Song curr = service.currentlyPlaying();
                        if (curr != null && curr.getSongId().equals(item.getSongId())) {
                            setStyle("-fx-background-color: rgba(30, 215, 96, 0.15);");
                        } else {
                            setStyle("");
                        }
                    }
                }
            };
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && (!row.isEmpty())) {
                    playSongDirectly(row.getItem());
                }
            });
            return row;
        });

        TableColumn<Song, String> numCol = new TableColumn<>("#");
        numCol.setPrefWidth(40);
        numCol.setCellValueFactory(data -> {
            int idx = playlistList.indexOf(data.getValue()) + 1;
            return new SimpleStringProperty(String.valueOf(idx));
        });

        TableColumn<Song, String> titleCol = new TableColumn<>("Title & Artist");
        titleCol.setPrefWidth(300);
        titleCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getTitle() + " — " + data.getValue().getArtist()));

        TableColumn<Song, String> idCol = new TableColumn<>("ID");
        idCol.setPrefWidth(70);
        idCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getSongId()));

        TableColumn<Song, String> audioCol = new TableColumn<>("Audio File");
        audioCol.setPrefWidth(220);
        audioCol.setCellValueFactory(data -> new SimpleStringProperty(audioEngine.getAudioFileName(data.getValue().getSongId())));

        TableColumn<Song, String> durationCol = new TableColumn<>("Duration");
        durationCol.setPrefWidth(80);
        durationCol.setCellValueFactory(data -> new SimpleStringProperty(estimateDuration(data.getValue().getTitle())));

        playlistTable.getColumns().addAll(numCol, titleCol, idCol, audioCol, durationCol);
    }

    private String estimateDuration(String title) {
        int hash = Math.abs(title.hashCode());
        int sec = 160 + (hash % 120);
        return String.format("%d:%02d", sec / 60, sec % 60);
    }

    // =========================================================================
    // 3. Right Queue Drawer (Up Next FIFO + Playback History LIFO)
    // =========================================================================

    private VBox createRightDrawer() {
        VBox drawer = new VBox(14);
        drawer.setPrefWidth(260);
        drawer.setMinWidth(240);
        drawer.setMaxWidth(300);
        drawer.getStyleClass().add("sidebar");
        drawer.setStyle("-fx-border-color: transparent transparent transparent -color-border-subtle; -fx-border-width: 0 0 0 1; -fx-padding: 20 14 16 14;");

        // Drawer Header with Close Button
        HBox header = new HBox();
        header.setAlignment(Pos.CENTER_LEFT);
        Label title = new Label("Up Next & History");
        title.getStyleClass().add("title-small");
        HBox.setHgrow(title, Priority.ALWAYS);

        Button closeBtn = createIconButton(Icons.CLOSE, "Close queue panel", this::toggleRightDrawer);
        header.getChildren().addAll(title, closeBtn);

        // 1. Up Next Section (FIFO)
        VBox queueSection = new VBox(8);
        VBox.setVgrow(queueSection, Priority.ALWAYS);

        HBox queueHeader = new HBox();
        queueHeader.setAlignment(Pos.CENTER_LEFT);
        Label queueLbl = new Label("Up Next (FIFO)");
        queueLbl.getStyleClass().add("title-small");
        HBox.setHgrow(queueLbl, Priority.ALWAYS);
        queueBadge = new Label("0");
        queueBadge.getStyleClass().add("status-pill");
        queueHeader.getChildren().addAll(queueLbl, queueBadge);

        upNextListView = new ListView<>(upNextItems);
        VBox.setVgrow(upNextListView, Priority.ALWAYS);

        HBox enqueueBox = new HBox(6);
        enqueueBox.setAlignment(Pos.CENTER_LEFT);
        quickEnqueueField = new TextField();
        quickEnqueueField.setPromptText("ID (e.g. S03)...");
        quickEnqueueField.getStyleClass().add("text-input-field");
        HBox.setHgrow(quickEnqueueField, Priority.ALWAYS);
        quickEnqueueField.setOnAction(e -> handleEnqueueById());

        Button addBtn = new Button("+ Add");
        addBtn.getStyleClass().add("secondary-button");
        addBtn.setOnAction(e -> handleEnqueueById());
        enqueueBox.getChildren().addAll(quickEnqueueField, addBtn);

        queueSection.getChildren().addAll(queueHeader, upNextListView, enqueueBox);

        // 2. Playback History Section (LIFO)
        VBox histSection = new VBox(8);
        VBox.setVgrow(histSection, Priority.ALWAYS);

        HBox histHeader = new HBox();
        histHeader.setAlignment(Pos.CENTER_LEFT);
        Label histLbl = new Label("History (LIFO, max 10)");
        histLbl.getStyleClass().add("title-small");
        HBox.setHgrow(histLbl, Priority.ALWAYS);
        historyBadge = new Label("0");
        historyBadge.getStyleClass().add("status-pill-muted");
        histHeader.getChildren().addAll(histLbl, historyBadge);

        historyListView = new ListView<>(historyItems);
        VBox.setVgrow(historyListView, Priority.ALWAYS);

        Button backBtn = new Button("↩ Replay Previous (History Back)");
        backBtn.setMaxWidth(Double.MAX_VALUE);
        backBtn.getStyleClass().add("secondary-button");
        backBtn.setOnAction(e -> handleBack());

        histSection.getChildren().addAll(histHeader, historyListView, backBtn);

        drawer.getChildren().addAll(header, queueSection, histSection);
        return drawer;
    }

    // =========================================================================
    // 4. Persistent Bottom Playback Bar
    // =========================================================================

    private Node createBottomPlayer() {
        BorderPane bar = new BorderPane();
        bar.getStyleClass().add("bottom-player");
        bar.setPrefHeight(82);

        // Left Section: Album Art Thumbnail & Song Title/Artist
        HBox left = new HBox(12);
        left.setAlignment(Pos.CENTER_LEFT);
        left.setPrefWidth(320);

        bottomThumb = new FxAlbumArtwork(54, 6);

        VBox titles = new VBox(2);
        titles.setAlignment(Pos.CENTER_LEFT);

        bottomTitle = new Label("TuneWave Player");
        bottomTitle.getStyleClass().add("title-small");

        bottomArtist = new Label("Ready to Play");
        bottomArtist.getStyleClass().add("caption");

        bottomAudioTag = new Label("Built-in Audio Ready");
        bottomAudioTag.setStyle("-fx-text-fill: #1ed760; -fx-font-size: 10px;");

        titles.getChildren().addAll(bottomTitle, bottomArtist, bottomAudioTag);
        left.getChildren().addAll(bottomThumb, titles);
        bar.setLeft(left);

        // Center Section: Transport Controls & Scrubber
        VBox center = new VBox(6);
        center.setAlignment(Pos.CENTER);

        HBox controls = new HBox(16);
        controls.setAlignment(Pos.CENTER);

        Button btnBack = createIconButton(Icons.HISTORY_BACK, "Replay last from history", this::handleBack);
        Button btnPrev = createIconButton(Icons.PREVIOUS, "Previous cursor song", this::handlePlaylistPrev);

        bottomPlayBtn = new Button();
        bottomPlayIcon = Icons.createIcon(Icons.PLAY, 0.9, Color.BLACK);
        bottomPlayBtn.setGraphic(bottomPlayIcon);
        bottomPlayBtn.getStyleClass().add("play-circle-button");
        bottomPlayBtn.setOnAction(e -> handleTogglePlayPause());

        Button btnNext = createIconButton(Icons.NEXT, "Play next track", this::handlePlayNext);
        bottomRepeatBtn = createIconButton(Icons.REPEAT, "Toggle repeat mode", this::handleToggleRepeat);

        controls.getChildren().addAll(btnBack, btnPrev, bottomPlayBtn, btnNext, bottomRepeatBtn);

        // Scrubber Row
        HBox scrubberRow = new HBox(10);
        scrubberRow.setAlignment(Pos.CENTER);

        bottomTimeCurrent = new Label("0:00");
        bottomTimeCurrent.getStyleClass().add("time-label");

        bottomSeekBar = new Slider(0, 100, 0);
        HBox.setHgrow(bottomSeekBar, Priority.ALWAYS);
        setupSeekSlider(bottomSeekBar);

        bottomTimeTotal = new Label("0:00");
        bottomTimeTotal.getStyleClass().add("time-label");

        scrubberRow.getChildren().addAll(bottomTimeCurrent, bottomSeekBar, bottomTimeTotal);
        center.getChildren().addAll(controls, scrubberRow);
        bar.setCenter(center);

        // Right Section: Status Pill, Volume Slider, Queue Toggle
        HBox right = new HBox(14);
        right.setAlignment(Pos.CENTER_RIGHT);
        right.setPrefWidth(320);

        bottomStatusPill = new Label("READY");
        bottomStatusPill.getStyleClass().add("status-pill-muted");

        SVGPath volIcon = Icons.createIcon(Icons.VOLUME, 0.8, Color.web("#b3b3b3"));

        volumeSlider = new Slider(0, 100, 85);
        volumeSlider.setPrefWidth(90);
        volumeSlider.valueProperty().addListener((obs, oldV, newV) -> {
            audioEngine.setVolume(newV.floatValue() / 100.0f);
        });

        Button queueBtn = createIconButton(Icons.QUEUE, "Toggle Queue Drawer", this::toggleRightDrawer);

        right.getChildren().addAll(bottomStatusPill, volIcon, volumeSlider, queueBtn);
        bar.setRight(right);

        return bar;
    }

    private Button createIconButton(String svgPath, String tooltip, Runnable action) {
        Button btn = new Button();
        SVGPath icon = Icons.createIcon(svgPath, 0.85, Color.web("#b3b3b3"));
        btn.setGraphic(icon);
        btn.getStyleClass().add("icon-button");
        btn.setOnAction(e -> action.run());
        return btn;
    }

    private void setupSeekSlider(Slider slider) {
        slider.setOnMousePressed(e -> {
            isUserSeeking = true;
            seekToMousePosition(slider, e.getX());
        });
        slider.setOnMouseDragged(e -> {
            seekToMousePosition(slider, e.getX());
        });
        slider.setOnMouseReleased(e -> {
            seekToMousePosition(slider, e.getX());
            isUserSeeking = false;
        });
    }

    private void seekToMousePosition(Slider slider, double mouseX) {
        double width = slider.getWidth();
        if (width <= 0) return;
        double pct = Math.max(0.0, Math.min(1.0, mouseX / width));
        heroSeekBar.setValue(pct * 100.0);
        bottomSeekBar.setValue(pct * 100.0);
        audioEngine.seekToPercent(pct);
        long posUs = audioEngine.getPositionMicroseconds();
        String posStr = AudioEngine.formatMicroseconds(posUs);
        heroTimeCurrent.setText(posStr);
        bottomTimeCurrent.setText(posStr);
    }

    // =========================================================================
    // Core Handlers & Service Integrations
    // =========================================================================

    private void handleTogglePlayPause() {
        Song curr = service.currentlyPlaying();
        if (curr == null) {
            curr = service.play();
        }

        if (curr == null) {
            refreshAllViews("Playlist is empty. Add songs to play.");
            return;
        }

        if (audioEngine.isPlaying()) {
            audioEngine.pause();
            refreshAllViews("Paused: " + curr.getTitle());
        } else if (audioEngine.isPaused() && curr.getSongId().equals(audioEngine.getActiveSongId())) {
            audioEngine.resume();
            refreshAllViews("Resumed: " + curr.getTitle());
        } else {
            if (audioEngine.hasAudio(curr.getSongId())) {
                audioEngine.play(curr.getSongId());
                refreshAllViews("Playing: " + curr.getTitle());
            } else {
                audioEngine.stop();
                refreshAllViews("No audio file linked to [" + curr.getSongId() + "]");
                promptLinkAudio(curr);
            }
        }
    }

    private void handlePlayNext() {
        Object res = service.playNext();
        if (res instanceof Song s) {
            playSongAudioOrPrompt(s, "Now playing: " + s.getTitle() + " by " + s.getArtist());
        } else if ("end".equals(res)) {
            audioEngine.stop();
            refreshAllViews("End of playlist reached. Repeat mode is OFF.");
        } else {
            audioEngine.stop();
            refreshAllViews("Playlist and Up Next queue are both empty.");
        }
    }

    private void handleBack() {
        Song s = service.back();
        if (s != null) {
            playSongAudioOrPrompt(s, "Replaying from history: " + s.getTitle());
        } else {
            refreshAllViews("History stack is empty.");
        }
    }

    private void handlePlaylistPrev() {
        Object res = service.playlistPrevious();
        if (res instanceof Song s) {
            Song played = service.play();
            playSongAudioOrPrompt(played != null ? played : s, "⏮ Previous: " + s.getTitle());
        } else if ("start".equals(res)) {
            audioEngine.seekToPercent(0.0);
            refreshAllViews("At head of playlist. Restarted track.");
        }
    }

    private void handleToggleRepeat() {
        boolean on = service.toggleRepeat();
        refreshAllViews("Repeat mode set to " + (on ? "ON (Wraps tail to head)" : "OFF"));
    }

    private void handleEnqueueById() {
        String id = quickEnqueueField.getText().trim();
        if (id.isEmpty()) return;
        Song s = service.getSong(id);
        if (s == null) {
            Alert alert = new Alert(Alert.AlertType.WARNING, "Song ID \"" + id + "\" does not exist in catalog.", ButtonType.OK);
            alert.setHeaderText("Unknown Song ID");
            alert.showAndWait();
            return;
        }
        service.addToUpNext(id);
        quickEnqueueField.clear();
        refreshAllViews("Enqueued to Up Next: " + s.getTitle());
    }

    private void playSongDirectly(Song song) {
        service.addToUpNext(song.getSongId());
        service.playNext();
        playSongAudioOrPrompt(song, "Playing: " + song.getTitle());
    }

    private void playSongAudioOrPrompt(Song s, String message) {
        if (audioEngine.hasAudio(s.getSongId())) {
            audioEngine.play(s.getSongId());
            refreshAllViews(message);
        } else {
            audioEngine.stop();
            refreshAllViews("No audio file assigned to [" + s.getSongId() + "]");
            promptLinkAudio(s);
        }
    }

    private void promptLinkAudio(Song song) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION,
                "No audio file is currently linked to:\n\"" + song.getTitle() + "\" [" + song.getSongId() + "]\n\n"
                        + "Would you like to select a local MP3 or WAV file now?",
                ButtonType.YES, ButtonType.NO);
        alert.setHeaderText("Link Audio File");
        alert.showAndWait().ifPresent(res -> {
            if (res == ButtonType.YES) {
                chooseAndLinkAudio(song.getSongId());
            }
        });
    }

    private void chooseAndLinkAudio(String songId) {
        if (songId == null) {
            List<Song> songs = service.getPlaylistSongs();
            if (songs.isEmpty()) return;
            songId = songs.get(0).getSongId();
        }

        FileChooser chooser = new FileChooser();
        chooser.setTitle("Select Audio File for [" + songId + "]");
        chooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("Audio Files (*.wav, *.mp3, *.aiff, *.au)", "*.wav", "*.mp3", "*.aiff", "*.au")
        );

        File file = chooser.showOpenDialog(primaryStage);
        if (file != null && file.exists()) {
            audioEngine.linkAudio(songId, file);
            Song curr = service.currentlyPlaying();
            if (curr != null && curr.getSongId().equals(songId)) {
                audioEngine.play(songId);
            }
            refreshAllViews("Linked " + file.getName() + " to [" + songId + "]");
        }
    }

    private void handlePlaySelectedFromLibrary() {
        Song s = playlistTable.getSelectionModel().getSelectedItem();
        if (s != null) playSongDirectly(s);
    }

    private void handleQueueSelectedFromLibrary() {
        Song s = playlistTable.getSelectionModel().getSelectedItem();
        if (s != null) {
            service.addToUpNext(s.getSongId());
            refreshAllViews("Added [" + s.getSongId() + "] to Up Next queue.");
        }
    }

    private void handleLinkAudioSelectedFromLibrary() {
        Song s = playlistTable.getSelectionModel().getSelectedItem();
        chooseAndLinkAudio(s != null ? s.getSongId() : null);
    }

    private void handleRemoveSelectedFromLibrary() {
        Song s = playlistTable.getSelectionModel().getSelectedItem();
        if (s != null) {
            service.removeSongFromPlaylist(s.getSongId());
            refreshAllViews("Removed [" + s.getSongId() + "] from playlist.");
        }
    }

    // =========================================================================
    // UI Refresh & Sync
    // =========================================================================

    private void setupRenderLoop() {
        renderLoop = new AnimationTimer() {
            @Override
            public void handle(long now) {
                if (audioEngine.isPlaying()) {
                    long posUs = audioEngine.getPositionMicroseconds();
                    long lenUs = audioEngine.getLengthMicroseconds();
                    double pct = (lenUs > 0) ? (double) posUs / lenUs : 0.0;

                    if (!isUserSeeking) {
                        heroSeekBar.setValue(pct * 100.0);
                        bottomSeekBar.setValue(pct * 100.0);
                    }

                    String posStr = AudioEngine.formatMicroseconds(posUs);
                    heroTimeCurrent.setText(posStr);
                    bottomTimeCurrent.setText(posStr);

                    if (lenUs > 0) {
                        String totalStr = AudioEngine.formatMicroseconds(lenUs);
                        heroTimeTotal.setText(totalStr);
                        bottomTimeTotal.setText(totalStr);
                    }

                    heroArtwork.tickAnimation();
                    bottomThumb.tickAnimation();
                }
            }
        };
        renderLoop.start();
    }

    private void refreshAllViews(String statusMsg) {
        Song playing = service.currentlyPlaying();
        boolean isAudioPlaying = audioEngine.isPlaying();

        // 1. Hero Card Updates
        if (playing != null) {
            heroArtwork.update(playing, isAudioPlaying);
            heroTitle.setText(playing.getTitle());
            heroArtist.setText(playing.getArtist());
            heroIdBadge.setText("ID: " + playing.getSongId());

            boolean hasAudio = audioEngine.hasAudio(playing.getSongId());
            heroAudioBadge.setText(hasAudio ? "AUDIO: " + audioEngine.getAudioFileName(playing.getSongId()) : "NO AUDIO LINKED");
            heroAudioBadge.getStyleClass().clear();
            heroAudioBadge.getStyleClass().add(hasAudio ? "status-pill" : "status-pill-amber");

            heroPlayBtn.setText(isAudioPlaying ? "Pause" : "Play");
            heroPlayBtn.setGraphic(Icons.createIcon(isAudioPlaying ? Icons.PAUSE : Icons.PLAY, 0.85, Color.BLACK));

            bottomThumb.update(playing, isAudioPlaying);
            bottomTitle.setText(playing.getTitle());
            bottomArtist.setText(playing.getArtist() + " • " + playing.getSongId());
            bottomAudioTag.setText(hasAudio ? "Source: " + audioEngine.getAudioFileName(playing.getSongId()) : "No audio source");
            bottomPlayIcon.setContent(isAudioPlaying ? Icons.PAUSE : Icons.PLAY);

            bottomStatusPill.setText(isAudioPlaying ? "PLAYING" : "PAUSED");
            bottomStatusPill.getStyleClass().clear();
            bottomStatusPill.getStyleClass().add(isAudioPlaying ? "status-pill" : "status-pill-amber");
        } else {
            heroArtwork.update(null, false);
            heroTitle.setText("Select a Song to Begin");
            heroArtist.setText("TuneWave Music Player");
            heroIdBadge.setText("IDLE");
            heroAudioBadge.setText("NO AUDIO ACTIVE");
            heroPlayBtn.setText("Play");
            heroPlayBtn.setGraphic(Icons.createIcon(Icons.PLAY, 0.85, Color.BLACK));

            bottomThumb.update(null, false);
            bottomTitle.setText("TuneWave Player");
            bottomArtist.setText("Ready to Play");
            bottomAudioTag.setText("No track loaded");
            bottomPlayIcon.setContent(Icons.PLAY);
            bottomStatusPill.setText("IDLE");
            bottomStatusPill.getStyleClass().clear();
            bottomStatusPill.getStyleClass().add("status-pill-muted");
        }

        // Repeat button state
        boolean rep = service.isRepeatEnabled();
        if (bottomRepeatBtn != null && bottomRepeatBtn.getGraphic() instanceof SVGPath path) {
            path.setFill(rep ? Color.web("#1ed760") : Color.web("#b3b3b3"));
        }

        // 2. Up Next Queue
        upNextItems.clear();
        List<String> upNextIds = service.getUpNextIds();
        queueBadge.setText(String.valueOf(upNextIds.size()));
        int qIdx = 1;
        for (String id : upNextIds) {
            Song s = service.getSong(id);
            upNextItems.add("#" + (qIdx++) + "  [" + id + "]  " + (s != null ? s.getTitle() : "Unknown"));
        }

        // 3. Playback History
        historyItems.clear();
        List<String> histIds = service.getHistoryIds();
        historyBadge.setText(String.valueOf(histIds.size()));
        int hIdx = 1;
        for (String id : histIds) {
            Song s = service.getSong(id);
            historyItems.add((hIdx++) + ".  [" + id + "]  " + (s != null ? s.getTitle() : "Unknown"));
        }

        // 4. Tables and Grids
        playlistList.setAll(service.getPlaylistSongs());
        libraryCountLabel.setText(playlistList.size() + " tracks • Custom Doubly-Linked List with O(1) Cursor Movement");
        populateQuickPlayGrid();

        if (statusMsg != null && primaryStage != null) {
            primaryStage.setTitle("TuneWave — " + statusMsg);
        }
    }
}
