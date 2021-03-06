package org.oasis_eu.portal.core.services.icons;

import com.google.common.io.ByteStreams;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.Mongo;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.oasis_eu.portal.core.config.MongoConfiguration;
import org.oasis_eu.portal.core.mongo.dao.icons.ImageDownloadAttemptRepository;
import org.oasis_eu.portal.core.mongo.dao.icons.ImageRepository;
import org.oasis_eu.portal.core.mongo.model.images.Image;
import org.oasis_eu.portal.core.mongo.model.images.ImageFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.UnknownHostException;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

@RunWith(SpringJUnit4ClassRunner.class)
@WebAppConfiguration
@SpringApplicationConfiguration(classes = {ImageServiceIntegrationTest.class})
@ComponentScan(basePackages = "org.oasis_eu.portal")
@Import(MongoConfiguration.class)
public class ImageServiceIntegrationTest {

	private DBCollection blacklist;

	@Bean
	public static PropertySourcesPlaceholderConfigurer propertyPlaceholderConfigurer() {
		return new PropertySourcesPlaceholderConfigurer();
	}


	@Value("${persistence.mongodatabase}")
	private String databaseName;

	@Autowired
	private ImageService imageService;

	@Autowired
	private Mongo mongo;

	private DB db;

	@Autowired
	private ImageRepository imageRepository;

	@Autowired
	private ImageDownloadAttemptRepository imageDownloadAttemptRepository;

	@Before
	public void clean() throws UnknownHostException {
		db = mongo.getDB(databaseName);

		blacklist = db.getCollection("image_download_attempt");

		imageRepository.deleteAll();
		imageDownloadAttemptRepository.deleteAll();

	}

	@Test
	@DirtiesContext
	public void testIconService() throws IOException {
		assertNotNull(imageService);

		ImageDownloader downloader = mock(ImageDownloader.class);
		when(downloader.download("http://www.citizenkin.com/icon/one.png")).thenReturn(load("images/64.png"));

		ReflectionTestUtils.setField(imageService, "imageDownloader", downloader);

		String iconUri = imageService.getImageForURL("http://www.citizenkin.com/icon/one.png", ImageFormat.PNG_64BY64, false);
		assertEquals(1, db.getCollection("image").count());
		assertNotNull(iconUri);
		// test that this matches a regexp including a UUID
		Pattern pattern = Pattern.compile("http://localhost/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/one.png");
		Matcher matcher = pattern.matcher(iconUri);
		assertTrue(matcher.matches());

		String id = matcher.group(1);
		assertNotNull(id);
		String hash = imageService.getHash(id);
		assertNotNull(hash);
		assertEquals("b357025fb8c2027cae8550b2e33df8f924d1aae35e2e5de4d4c14430636be6ab", hash);

		Image image = imageService.getImage(id);
		assertEquals(hash, image.getHash());
	}

	@Test
	public void testBlacklisting() throws Exception {
		ImageDownloader downloader = mock(ImageDownloader.class);
		when(downloader.download("http://www.citizenkin.com/icon/fake.png")).thenReturn(null);
		when(downloader.download("http://www.citizenkin.com/icon/rectangular.png")).thenReturn(load("images/rectangular.png"));
		when(downloader.download("http://www.citizenkin.com/icon/icon.tiff")).thenReturn(load("images/img-test.tiff"));

		ReflectionTestUtils.setField(imageService, "imageDownloader", downloader);

		assertEquals(0, blacklist.count());
		String uri = imageService.getImageForURL("http://www.citizenkin.com/icon/fake.png", ImageFormat.PNG_64BY64, false);
		assertEquals(defaultIcon(), uri);
		assertEquals(1, blacklist.count());

		imageService.getImageForURL("http://www.citizenkin.com/icon/rectangular.png", ImageFormat.PNG_64BY64, false);
		assertEquals(2, blacklist.count());

		imageService.getImageForURL("http://www.citizenkin.com/icon/icon.tiff", ImageFormat.PNG_64BY64, false);
		assertEquals(3, blacklist.count());

		imageService.getImageForURL("http://www.citizenkin.com/icon/fake.png", ImageFormat.PNG_64BY64, false);
		imageService.getImageForURL("http://www.citizenkin.com/icon/rectangular.png", ImageFormat.PNG_64BY64, false);
		imageService.getImageForURL("http://www.citizenkin.com/icon/icon.tiff", ImageFormat.PNG_64BY64, false);

		// check that we only called the downloader three times
		verify(downloader, times(3)).download(anyString());

		// the following really only tests MongoDB's TTL eviction code. It takes a couple minutes to run and doesn't
		// test our code, so let's forget about it for now.

//		LoggerFactory.getLogger(IconServiceIntegrationTest.class).info("Waiting for two minutes so MongoDB's TTL eviction kicks in - go brew a cup of tea or something.");
//
//		Thread.sleep(120000);
//
//		assertEquals(0, blacklist.count());
	}

	@Test
	public void testDummyData() throws Exception {
		assertNull(imageService.getHash(UUID.randomUUID().toString()));
		assertNull(imageService.getImage(UUID.randomUUID().toString()));
	}

	private byte[] load(String name) throws IOException {
		InputStream stream = getClass().getClassLoader().getResourceAsStream(name);
		return ByteStreams.toByteArray(stream);
	}

	private String defaultIcon() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
		Method method = imageService.getClass().getDeclaredMethod("defaultIcon");
		method.setAccessible(true);
		return (String) method.invoke(imageService);
	}
}